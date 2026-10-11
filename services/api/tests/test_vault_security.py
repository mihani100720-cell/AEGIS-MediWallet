import pytest
from fastapi.testclient import TestClient
from services.api.app.main import app
from services.api.app.core.security import create_access_token, hash_password, hash_vault_password
from services.api.app.models.database import SessionLocal, User, MedicalRecord, VaultSession

client = TestClient(app)

def test_vault_flow_and_security_controls():
    # 1. Login or obtain access token for patient (ID 1)
    patient_token = create_access_token(1)
    headers = {"Authorization": f"Bearer {patient_token}"}

    # 2. Check initial vault status (should be configured, but locked)
    status_res = client.get("/api/v1/records/vault/status", headers=headers)
    assert status_res.status_code == 200
    data = status_res.json()
    assert data["is_configured"] is True
    assert data["is_unlocked"] is False

    # 3. Test incorrect password unlock
    wrong_unlock = client.post("/api/v1/records/vault/unlock", json={"password": "WrongPassword999!"}, headers=headers)
    assert wrong_unlock.status_code == 401
    assert "Incorrect vault password" in wrong_unlock.json()["detail"]

    # 4. Test unauthenticated / un-unlocked preview (MUST be denied with 403)
    rec_list = client.get("/api/v1/records", headers=headers).json()
    assert len(rec_list) > 0
    first_record_id = rec_list[0]["id"]

    locked_preview = client.get(f"/api/v1/records/{first_record_id}/preview", headers=headers)
    assert locked_preview.status_code == 403
    assert "Vault is locked" in locked_preview.json()["detail"]

    # 5. Unlock vault with valid password (Vault@123)
    unlock_res = client.post("/api/v1/records/vault/unlock", json={"password": "Vault@123"}, headers=headers)
    assert unlock_res.status_code == 200
    vault_token = unlock_res.json()["vault_token"]
    assert len(vault_token) > 20

    vault_headers = {
        "Authorization": f"Bearer {patient_token}",
        "X-Vault-Token": vault_token
    }

    # 6. Verify status is now unlocked
    unlocked_status = client.get("/api/v1/records/vault/status", headers=vault_headers)
    assert unlocked_status.status_code == 200
    assert unlocked_status.json()["is_unlocked"] is True

    # 7. Authorized preview should now succeed with 200 and security headers
    preview_res = client.get(f"/api/v1/records/{first_record_id}/preview", headers=vault_headers)
    assert preview_res.status_code == 200
    assert preview_res.headers.get("x-content-type-options") == "nosniff"

    # 8. Authorized download should succeed
    download_res = client.get(f"/api/v1/records/{first_record_id}/download", headers=vault_headers)
    assert download_res.status_code == 200
    assert "attachment" in download_res.headers.get("content-disposition", "")

    # 9. Test real PDF upload with valid magic bytes
    valid_pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    upload_res = client.post(
        "/api/v1/records/upload",
        data={
            "title": "Automated Test Blood Panel",
            "category": "Lab Report",
            "doctor_name": "Dr. Test Pathologist",
            "hospital_name": "Metro Diagnostics",
            "record_date": "2026-10-10"
        },
        files={"file": ("test_panel.pdf", valid_pdf_bytes, "application/pdf")},
        headers=vault_headers
    )
    assert upload_res.status_code == 200
    new_record_id = upload_res.json()["record_id"]

    # 10. Test invalid upload with fake magic bytes (executable/text pretending to be PDF)
    fake_pdf_bytes = b"NOT_A_REAL_PDF_HEADER_MALICIOUS_EXE"
    bad_upload = client.post(
        "/api/v1/records/upload",
        data={"title": "Fake PDF", "category": "General"},
        files={"file": ("fake.pdf", fake_pdf_bytes, "application/pdf")},
        headers=vault_headers
    )
    assert bad_upload.status_code == 400
    assert "File content signature mismatch" in bad_upload.json()["detail"]

    # 11. Rename newly uploaded record
    rename_res = client.patch(
        f"/api/v1/records/{new_record_id}/rename",
        json={"title": "Updated Test Blood Panel 2026", "category": "Lab Report"},
        headers=vault_headers
    )
    assert rename_res.status_code == 200
    assert rename_res.json()["record"]["title"] == "Updated Test Blood Panel 2026"

    # 12. Test IDOR Protection (Patient 2 trying to access Patient 1's records)
    patient2_token = create_access_token(2)
    # Give patient 2 their own unlocked vault
    db = SessionLocal()
    u2 = db.query(User).filter(User.id == 2).first()
    if u2:
        h, s = hash_vault_password("Vault@123")
        u2.vault_password_hash = h
        u2.vault_salt = s
        db.commit()
    db.close()

    p2_unlock = client.post(
        "/api/v1/records/vault/unlock",
        json={"password": "Vault@123"},
        headers={"Authorization": f"Bearer {patient2_token}"}
    )
    p2_vault_token = p2_unlock.json()["vault_token"]

    idor_headers = {
        "Authorization": f"Bearer {patient2_token}",
        "X-Vault-Token": p2_vault_token
    }
    # Patient 2 tries to preview Patient 1's record
    idor_res = client.get(f"/api/v1/records/{new_record_id}/preview", headers=idor_headers)
    assert idor_res.status_code == 403

    # 13. Delete newly uploaded record
    del_res = client.delete(f"/api/v1/records/{new_record_id}", headers=vault_headers)
    assert del_res.status_code == 200

    # 14. Manual Lock Vault
    lock_res = client.post("/api/v1/records/vault/lock", headers=vault_headers)
    assert lock_res.status_code == 200

    # Check that previous vault session token is now invalid/locked
    recheck_preview = client.get(f"/api/v1/records/{first_record_id}/preview", headers=vault_headers)
    assert recheck_preview.status_code == 403
