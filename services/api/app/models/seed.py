import json
import os
from datetime import datetime, timezone, timedelta
from .database import SessionLocal, init_db, User, FamilyMember, MedicalRecord, DoctorProfile, EmergencyProfile, Medicine, Appointment, SecurityEvent, AccessAuditLog
from ..core.security import hash_password, hash_vault_password
from ..core.config import settings

def seed_database():
    init_db()
    db = SessionLocal()
    try:
        # Check if already seeded, ensure vault password is set
        existing_patient = db.query(User).filter(User.email == "patient@mediwallet.health").first()
        if existing_patient:
            if not existing_patient.vault_password_hash or not existing_patient.vault_salt:
                vh, vs = hash_vault_password("Vault@123")
                existing_patient.vault_password_hash = vh
                existing_patient.vault_salt = vs
                db.commit()
            print("Database already contains records. Updated vault protection if needed.")
            return

        # 1. Create Patient User (Aarav Sharma) with configured Vault Protection
        vault_hash, vault_salt = hash_vault_password("Vault@123")
        patient = User(
            email="patient@mediwallet.health",
            hashed_password=hash_password("Patient@123"),
            full_name="Aarav Sharma",
            role="patient",
            phone="+91 98765 43210",
            blood_group="B+",
            passkey_registered=True,
            preferred_language="en",
            vault_password_hash=vault_hash,
            vault_salt=vault_salt
        )
        db.add(patient)

        # 2. Create Doctor User (Dr. Priya Nair, MD)
        doctor = User(
            email="doctor@mediwallet.health",
            hashed_password=hash_password("Doctor@123"),
            full_name="Dr. Priya Nair, MD",
            role="doctor",
            phone="+91 98450 12345",
            blood_group="A+",
            passkey_registered=True,
            preferred_language="en"
        )
        db.add(doctor)

        # 3. Create Admin User (Healthcare Authority Admin)
        admin = User(
            email="admin@mediwallet.health",
            hashed_password=hash_password("Admin@123"),
            full_name="MediWallet Security Admin",
            role="admin",
            phone="+91 80000 99999",
            blood_group="O+",
            passkey_registered=True,
            preferred_language="en"
        )
        db.add(admin)
        db.commit()

        # Doctor Profile
        doc_profile = DoctorProfile(
            user_id=doctor.id,
            medical_reg_no="MCI-2018-884920",
            specialization="Chief Cardiologist & Internal Medicine",
            hospital_affiliation="Apollo Health City, Jubilee Hills",
            verification_status="verified",
            verified_at=datetime.now(timezone.utc) - timedelta(days=90),
            badge_issued=True,
            document_proof_url="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600"
        )
        db.add(doc_profile)

        # Family Members for Aarav
        f1 = FamilyMember(
            primary_user_id=patient.id,
            name="Sunita Sharma",
            relation="Mother",
            age=62,
            blood_group="B+",
            face_enrolled=True,
            emergency_contact="+91 98765 43211"
        )
        f2 = FamilyMember(
            primary_user_id=patient.id,
            name="Rohan Sharma",
            relation="Child",
            age=11,
            blood_group="O+",
            face_enrolled=False,
            emergency_contact="+91 98765 43210"
        )
        db.add_all([f1, f2])

        # Emergency Profile for Aarav
        emerg = EmergencyProfile(
            user_id=patient.id,
            blood_group="B+",
            allergies=json.dumps(["Penicillin", "Sulfonamides", "Peanuts"]),
            chronic_conditions=json.dumps(["Hypertension (Mild)", "Type 2 Diabetes Mellitus"]),
            current_medications=json.dumps(["Metformin 500mg BD", "Telmisartan 40mg OD", "Atorvastatin 10mg HS"]),
            emergency_contacts=json.dumps([
                {"name": "Sunita Sharma (Mother)", "phone": "+91 98765 43211", "relation": "Mother"},
                {"name": "Dr. Priya Nair (Primary Physician)", "phone": "+91 98450 12345", "relation": "Doctor"}
            ]),
            qr_payload=json.dumps({
                "patient": "Aarav Sharma",
                "blood": "B+",
                "allergies": ["Penicillin", "Sulfonamides", "Peanuts"],
                "conditions": ["Hypertension", "Type 2 Diabetes"],
                "contacts": ["+91 98765 43211", "+91 98450 12345"],
                "system": "MEDIWALLET_SECURE_OFFLINE_SHIELD_V1"
            })
        )
        db.add(emerg)

        # Seed Medical Records (with realistic clinical data, extracted values, ranges)
        rec1 = MedicalRecord(
            user_id=patient.id,
            title="Complete Blood Count (CBC) & Metabolic Panel",
            category="Lab Report",
            doctor_name="Dr. K. S. Rao",
            hospital_name="Vijaya Diagnostics",
            record_date="2026-08-14",
            file_name="Vijaya_CBC_Panel_2026.pdf",
            file_url="/sample_docs/cbc_report.pdf",
            file_size=428900,
            sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            extracted_text="Hemoglobin: 14.2 g/dL. Fasting Blood Sugar: 142 mg/dL. HbA1c: 7.1%. Total Leukocyte Count: 7,400 /mcL. Platelets: 240,000 /mcL. Serum Creatinine: 0.9 mg/dL.",
            structured_data=json.dumps([
                {"test": "Hemoglobin", "value": "14.2", "unit": "g/dL", "ref_range": "13.0 - 17.0", "status": "normal"},
                {"test": "Fasting Blood Sugar", "value": "142", "unit": "mg/dL", "ref_range": "70 - 100", "status": "high", "flag": True},
                {"test": "HbA1c Glycated", "value": "7.1", "unit": "%", "ref_range": "< 5.7", "status": "high", "flag": True},
                {"test": "Total Leukocytes", "value": "7,400", "unit": "/mcL", "ref_range": "4,000 - 11,000", "status": "normal"},
                {"test": "Platelet Count", "value": "240,000", "unit": "/mcL", "ref_range": "150,000 - 450,000", "status": "normal"},
                {"test": "Serum Creatinine", "value": "0.9", "unit": "mg/dL", "ref_range": "0.7 - 1.3", "status": "normal"}
            ]),
            ai_summary="Grounded Report Summary: Fasting blood sugar (142 mg/dL) and HbA1c (7.1%) are elevated above standard reference ranges, consistent with monitored Type 2 Diabetes. Hematology indices (Hemoglobin 14.2 g/dL, Platelets 240,000) and Renal function (Creatinine 0.9 mg/dL) remain well within normal limits.",
            is_abnormal=True,
            ocr_status="completed"
        )

        rec2 = MedicalRecord(
            user_id=patient.id,
            title="Comprehensive Lipid & Cardiac Risk Profile",
            category="Lab Report",
            doctor_name="Dr. Priya Nair, MD",
            hospital_name="Apollo Health City",
            record_date="2026-07-02",
            file_name="Apollo_Lipid_Profile_July2026.pdf",
            file_url="/sample_docs/lipid_profile.pdf",
            file_size=312450,
            sha256_hash="5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
            extracted_text="Total Cholesterol: 198 mg/dL. HDL (Good): 46 mg/dL. LDL (Bad): 118 mg/dL. Triglycerides: 165 mg/dL. VLDL: 34 mg/dL.",
            structured_data=json.dumps([
                {"test": "Total Cholesterol", "value": "198", "unit": "mg/dL", "ref_range": "< 200", "status": "normal"},
                {"test": "HDL Cholesterol", "value": "46", "unit": "mg/dL", "ref_range": "> 40", "status": "normal"},
                {"test": "LDL Cholesterol", "value": "118", "unit": "mg/dL", "ref_range": "< 100", "status": "borderline", "flag": True},
                {"test": "Triglycerides", "value": "165", "unit": "mg/dL", "ref_range": "< 150", "status": "borderline", "flag": True}
            ]),
            ai_summary="Grounded Report Summary: Total cholesterol is optimal (<200 mg/dL). Mild elevation noted in Triglycerides (165 mg/dL) and LDL (118 mg/dL). Physician recommends lifestyle adherence and continuation of Atorvastatin 10mg.",
            is_abnormal=True,
            ocr_status="completed"
        )

        rec3 = MedicalRecord(
            user_id=patient.id,
            title="Handwritten Outpatient Prescription — Cardiology",
            category="Prescription",
            doctor_name="Dr. Priya Nair, MD",
            hospital_name="Apollo Heart Centre",
            record_date="2026-07-05",
            file_name="Rx_Cardio_Apollo_Jul2026.jpg",
            file_url="/sample_docs/rx_handwritten.jpg",
            file_size=685000,
            sha256_hash="4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
            extracted_text="Rx: 1. Tab. Telmisartan 40mg - 1-0-0 (Morning after food) x 30 days. 2. Tab. Metformin 500mg - 1-0-1 (With meals) x 30 days. 3. Tab. Atorvastatin 10mg - 0-0-1 (Night) x 30 days. Review in 3 months.",
            structured_data=json.dumps([
                {"medicine": "Telmisartan", "strength": "40mg", "timing": "1-0-0 Morning after breakfast", "duration": "30 days", "confidence": 0.94},
                {"medicine": "Metformin", "strength": "500mg", "timing": "1-0-1 Twice daily with meals", "duration": "30 days", "confidence": 0.96},
                {"medicine": "Atorvastatin", "strength": "10mg", "timing": "0-0-1 Once daily at bedtime", "duration": "30 days", "confidence": 0.91}
            ]),
            ai_summary="RxScript OCR Extraction: Identified 3 medications with high confidence (>90%). Verified against Indian Pharmacopoeia reference database for hypertension and glycemic management.",
            is_abnormal=False,
            ocr_status="completed"
        )
        db.add_all([rec1, rec2, rec3])

        # Seed Medicines
        meds = [
            Medicine(name="Telmisartan", generic_name="Telmisartan", dosage_form="Tablet", standard_dose="40 mg OD", indications="Essential Hypertension, Cardiovascular Risk Reduction", contraindications="Pregnancy, Biliary obstructive disorders", common_side_effects="Dizziness, Back pain, Sinus congestion"),
            Medicine(name="Metformin", generic_name="Metformin Hydrochloride", dosage_form="Extended Release Tablet", standard_dose="500 mg BD", indications="Type 2 Diabetes Mellitus, Insulin Resistance", contraindications="Severe renal impairment (eGFR <30), Acute metabolic acidosis", common_side_effects="Gastrointestinal upset, Nausea, Metallic taste"),
            Medicine(name="Atorvastatin", generic_name="Atorvastatin Calcium", dosage_form="Film-coated Tablet", standard_dose="10 mg - 20 mg HS", indications="Hypercholesterolemia, Primary prevention of cardiovascular events", contraindications="Active liver disease, Unexplained persistent transaminase elevations", common_side_effects="Myalgia, Headache, Mild dyspepsia"),
            Medicine(name="Paracetamol", generic_name="Acetaminophen", dosage_form="Tablet / Syrup", standard_dose="500 mg - 650 mg SOS", indications="Mild to moderate pain, Pyrexia / Fever", contraindications="Severe active hepatic disease", common_side_effects="Well tolerated; rare skin reactions"),
            Medicine(name="Amoxicillin", generic_name="Amoxicillin Trihydrate", dosage_form="Capsule", standard_dose="500 mg TDS", indications="Bacterial infections of ear, nose, throat, respiratory tract", contraindications="Known penicillin or beta-lactam hypersensitivity", common_side_effects="Diarrhea, Rash, Nausea"),
            Medicine(name="Pantoprazole", generic_name="Pantoprazole Sodium", dosage_form="Gastro-resistant Tablet", standard_dose="40 mg OD before breakfast", indications="GERD, Peptic ulcer disease, NSAID gastroprotection", contraindications="Hypersensitivity to substituted benzimidazoles", common_side_effects="Headache, Abdominal discomfort, Flatulence"),
            Medicine(name="Azithromycin", generic_name="Azithromycin", dosage_form="Tablet", standard_dose="500 mg OD x 3-5 days", indications="Respiratory tract infections, Community-acquired pneumonia", contraindications="Cholestatic jaundice/hepatic dysfunction with prior azithromycin", common_side_effects="GI cramps, Nausea, QT prolongation potential")
        ]
        db.add_all(meds)

        # Seed Appointments
        app1 = Appointment(
            user_id=patient.id,
            doctor_id=doctor.id,
            doctor_name="Dr. Priya Nair, MD",
            clinic="Apollo Health City — Suite 402",
            appointment_date=datetime.now(timezone.utc) + timedelta(days=4, hours=3),
            status="scheduled",
            follow_up_instructions="Bring latest fasting blood sugar logs and lipid repeat panel.",
            reminder_sent=False
        )
        app2 = Appointment(
            user_id=patient.id,
            doctor_id=None,
            doctor_name="Dr. Sandeep Reddy",
            clinic="Care Hospital Ophthalmology",
            appointment_date=datetime.now(timezone.utc) + timedelta(days=18),
            status="scheduled",
            follow_up_instructions="Annual diabetic retinopathy fundus screening.",
            reminder_sent=False
        )
        db.add_all([app1, app2])

        # Security Events
        sec1 = SecurityEvent(
            user_id=patient.id,
            event_type="passkey_registered",
            ip_address="103.24.11.89",
            user_agent="Chrome 131 on Windows 11",
            severity="low",
            details="FIDO2 WebAuthn biometric passkey enrolled for secure zero-password login."
        )
        sec2 = SecurityEvent(
            user_id=patient.id,
            event_type="failed_login",
            ip_address="198.51.100.22",
            user_agent="Firefox 129 on Linux",
            severity="medium",
            details="Incorrect password attempt detected from unfamiliar geolocation. IP rate-limited for 15 minutes."
        )
        db.add_all([sec1, sec2])

        # Access Audit Log
        audit1 = AccessAuditLog(
            record_id=rec1.id,
            accessor_id=doctor.id,
            accessor_name="Dr. Priya Nair, MD",
            accessor_role="doctor",
            action="view",
            timestamp=datetime.now(timezone.utc) - timedelta(days=3)
        )
        db.add(audit1)

        db.commit()
        print("Database successfully seeded with realistic clinical data.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
