
import requests
import os

# Invoice ID from invoices.json (Manual Entry V2)
INVOICE_ID = "2162fd0e-4c1c-44a5-8b47-84dda99c4b33"
URL = f"http://127.0.0.1:8000/invoices/{INVOICE_ID}/upload"

# Create a dummy PDF file
dummy_filename = "test_upload.pdf"
with open(dummy_filename, "wb") as f:
    f.write(b"%PDF-1.4\n%Dummy PDF content")

print(f"Uploading {dummy_filename} to {URL}...")

try:
    with open(dummy_filename, "rb") as f:
        files = {"file": (dummy_filename, f, "application/pdf")}
        response = requests.post(URL, files=files)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("Upload successful!")
except Exception as e:
    print(f"Error: {e}")
finally:
    # Cleanup
    if os.path.exists(dummy_filename):
        os.remove(dummy_filename)
