import json
from pathlib import Path
from fastapi.testclient import TestClient

# Import the FastAPI app
from app.main import app  # assuming cwd is backend/app

# Create a tiny dummy file (not a real PE, just to test flow)
dummy_path = Path('dummy_test.bin')
dummy_path.write_bytes(b'HelloWorld' * 10)  # 100 bytes

client = TestClient(app)

with dummy_path.open('rb') as f:
    files = {'file': ('dummy_test.bin', f, 'application/octet-stream')}
    response = client.post('/api/v1/analyze', files=files)

print('Status:', response.status_code)
print('Response JSON:', response.json())

# Write the full response to a file for sharing
out_path = Path('demo_output.json')
out_path.write_text(json.dumps(response.json(), indent=2))
print('Wrote output to', out_path)
