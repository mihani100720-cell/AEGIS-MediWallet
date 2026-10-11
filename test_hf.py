import sys
print("Python:", sys.version)

try:
    from PIL import Image
    import numpy as np
    print("PIL and NumPy available!")
except Exception as e:
    print("PIL/NumPy error:", e)

try:
    import cv2
    print("OpenCV version:", cv2.__version__)
except Exception as e:
    print("OpenCV error:", e)

try:
    from transformers import pipeline, TrOCRProcessor, VisionEncoderDecoderModel
    print("Transformers available! TrOCRProcessor and VisionEncoderDecoderModel imported.")
except Exception as e:
    print("Transformers error:", e)
