import sys
import requests
import time

def check_api(url):
    print(f"Checking API at {url}...")
    
    # 1. Health Check
    health_url = f"{url.rstrip('/')}/health"
    try:
        response = requests.get(health_url, timeout=10)
        print(f"GET {health_url} - Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Error: Expected 200, got {response.status_code}")
            return False
            
        data = response.json()
        if data.get("status") != "ok":
            print(f"Error: Health status is not 'ok': {data}")
            return False
            
        # Check for CORS headers in GET response
        if "Access-Control-Allow-Origin" not in response.headers:
            print("Warning: Access-Control-Allow-Origin header missing in GET response")
            # We don't fail here yet, let's check OPTIONS
            
    except Exception as e:
        print(f"Error during health check: {e}")
        return False

    # 2. CORS Preflight (OPTIONS)
    print("\nChecking CORS Preflight (OPTIONS)...")
    try:
        # Use production origin to verify CORS config
        production_origin = "https://suhradyouths.hpparam.com"
        headers = {
            "Origin": production_origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        }
        response = requests.options(health_url, headers=headers, timeout=10)
        print(f"OPTIONS {health_url} (Origin: {production_origin}) - Status: {response.status_code}")
        
        # Mangum/FastAPI usually return 200 or 204 for OPTIONS
        if response.status_code not in [200, 204]:
            print(f"Error: Expected 200 or 204 for OPTIONS, got {response.status_code}")
            return False
            
        cors_header = response.headers.get("Access-Control-Allow-Origin")
        print(f"Access-Control-Allow-Origin: {cors_header}")
        
        if not cors_header:
            print("Error: Access-Control-Allow-Origin header missing in OPTIONS response!")
            return False
            
        if cors_header != production_origin and cors_header != "*":
            print(f"Error: CORS header mismatch! Expected '{production_origin}' or '*', got '{cors_header}'")
            return False
            
    except Exception as e:
        print(f"Error during CORS check: {e}")
        return False

    print("\n✅ API is healthy and CORS is configured correctly!")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python smoke_test.py <VITE_API_BASE_URL>")
        sys.exit(1)
        
    vite_api_base_url = sys.argv[1]
    
    # Retry a few times as Lambda might still be updating or cold starting
    max_retries = 3
    for i in range(max_retries):
        if check_api(vite_api_base_url):
            sys.exit(0)
        if i < max_retries - 1:
            print(f"Retrying in 5 seconds... ({i+1}/{max_retries})")
            time.sleep(5)
            
    print("\n❌ Smoke test failed after retries.")
    sys.exit(1)
