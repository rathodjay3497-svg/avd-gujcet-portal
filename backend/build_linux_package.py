"""
build_linux_package.py
----------------------
Rebuilds the `package/` directory with Linux-compatible (manylinux) wheels
instead of Windows .pyd files. Run this from the backend/ directory:

    python build_linux_package.py
"""

import os
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

BASE_DIR = Path(__file__).parent
PACKAGE_DIR = BASE_DIR / "package"
DOWNLOAD_DIR = BASE_DIR / "tmp_linux_wheels"
REQUIREMENTS = BASE_DIR / "requirements.txt"
APP_DIR = BASE_DIR / "app"
OUTPUT_ZIP = BASE_DIR / "deployment_package.zip"

PYTHON_VERSION = "3.12"
PLATFORM = "manylinux2014_x86_64"
IMPL = "cp"

def run(cmd, **kwargs):
    print(f"\n>>> {cmd}")
    result = subprocess.run(cmd, shell=True, check=True, **kwargs)
    return result

def main():
    # 1. Clean old package dir and download dir
    print("=== Step 1: Cleaning old package/ and download dirs ===")
    if PACKAGE_DIR.exists():
        shutil.rmtree(PACKAGE_DIR)
    if DOWNLOAD_DIR.exists():
        shutil.rmtree(DOWNLOAD_DIR)
    PACKAGE_DIR.mkdir()
    DOWNLOAD_DIR.mkdir()

    # 2. Download Linux-compatible wheels
    print("\n=== Step 2: Downloading Linux wheels ===")
    run(
        f'pip download '
        f'--only-binary=:all: '
        f'--platform {PLATFORM} '
        f'--python-version {PYTHON_VERSION} '
        f'--implementation {IMPL} '
        f'-r "{REQUIREMENTS}" '
        f'-d "{DOWNLOAD_DIR}"'
    )

    # 3. Also try manylinux_2_17 for packages that may only have that tag
    #    (pip will skip packages already downloaded)
    print("\n=== Step 3: Filling gaps with manylinux_2_17_x86_64 ===")
    try:
        run(
            f'pip download '
            f'--only-binary=:all: '
            f'--platform manylinux_2_17_x86_64 '
            f'--python-version {PYTHON_VERSION} '
            f'--implementation {IMPL} '
            f'-r "{REQUIREMENTS}" '
            f'-d "{DOWNLOAD_DIR}"'
        )
    except subprocess.CalledProcessError:
        print("  (some packages may not have manylinux_2_17 builds, continuing...)")

    # 4. Extract all wheels into package/
    print("\n=== Step 4: Extracting wheels into package/ ===")
    wheels = list(DOWNLOAD_DIR.glob("*.whl"))
    print(f"  Found {len(wheels)} wheel(s)")
    for whl in wheels:
        print(f"  Extracting {whl.name}")
        with zipfile.ZipFile(whl, "r") as z:
            z.extractall(PACKAGE_DIR)

    # 5. Remove any .dist-info and __pycache__ to trim size
    print("\n=== Step 5: Removing .dist-info and __pycache__ ===")
    for path in PACKAGE_DIR.rglob("*.dist-info"):
        if path.is_dir():
            shutil.rmtree(path)
    for path in PACKAGE_DIR.rglob("__pycache__"):
        if path.is_dir():
            shutil.rmtree(path)

    # 6. Check for any remaining Windows .pyd files
    remaining_pyds = list(PACKAGE_DIR.rglob("*.pyd"))
    if remaining_pyds:
        print("\n⚠️  WARNING: Found remaining Windows .pyd files (no Linux builds available):")
        for p in remaining_pyds:
            print(f"   {p.relative_to(PACKAGE_DIR)}")
        print("  These will be removed (they won't work on Lambda anyway).")
        for p in remaining_pyds:
            p.unlink()
    else:
        print("\n✅ No Windows .pyd files remaining.")

    # 7. Check for Linux .so files from pydantic-core (key check)
    so_files = list(PACKAGE_DIR.rglob("_pydantic_core*.so"))
    if so_files:
        print(f"\n✅ pydantic_core Linux binary found: {so_files[0].name}")
    else:
        print("\n❌ ERROR: pydantic_core Linux .so not found! Build may have issues.")
        sys.exit(1)

    # 8. Build the deployment zip: package/ contents + app/ code
    print(f"\n=== Step 6: Building {OUTPUT_ZIP.name} ===")
    if OUTPUT_ZIP.exists():
        OUTPUT_ZIP.unlink()

    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED) as zf:
        # Add package/ contents (dependencies) at the root of the zip
        for f in PACKAGE_DIR.rglob("*"):
            if f.is_file():
                zf.write(f, f.relative_to(PACKAGE_DIR))

        # Add app/ code
        for f in APP_DIR.rglob("*"):
            if f.is_file() and "__pycache__" not in str(f):
                zf.write(f, f.relative_to(BASE_DIR))

    size_mb = OUTPUT_ZIP.stat().st_size / (1024 * 1024)
    print(f"\n✅ Built {OUTPUT_ZIP.name} ({size_mb:.1f} MB)")

    # 9. Cleanup temp download dir
    shutil.rmtree(DOWNLOAD_DIR)
    print("✅ Cleaned up temp download dir.")
    print("\n🎉 Done! Upload deployment_package.zip to Lambda.")


if __name__ == "__main__":
    main()
