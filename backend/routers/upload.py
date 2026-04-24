from fastapi import APIRouter, Depends, UploadFile, File
from pathlib import Path
import uuid, shutil, hashlib
from collections import defaultdict

from auth import require_admin, get_current_user

router = APIRouter(prefix="/api/upload", tags=["upload"])

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


@router.post("")
async def upload_image(
    file: UploadFile = File(...),
    _admin: dict = Depends(require_admin),
):
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Format de fitxer no permès")
    filename = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / filename
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"url": f"/uploads/{filename}"}


@router.get("/images", response_model=list)
async def list_images(current_user=Depends(get_current_user)):
    images = []
    if UPLOAD_DIR.exists():
        for f in sorted(UPLOAD_DIR.iterdir()):
            if f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                images.append({"url": f"/uploads/{f.name}", "name": f.name})
    return images


@router.delete("/images/{filename}")
async def delete_image(filename: str, _admin: dict = Depends(require_admin)):
    from fastapi import HTTPException
    # Prevent path traversal
    safe = Path(filename).name
    if safe != filename:
        raise HTTPException(status_code=400, detail="Nom de fitxer invàlid")
    target = UPLOAD_DIR / safe
    if not target.exists() or target.suffix.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=404, detail="Imatge no trobada")
    target.unlink()
    return {"ok": True}


@router.delete("/dedup")
async def dedup_images(_admin: dict = Depends(require_admin)):
    """Delete duplicate image files (same content hash). Keeps oldest file per hash."""
    from database import get_db
    from sqlalchemy import text as sa_text

    if not UPLOAD_DIR.exists():
        return {"deleted": [], "kept": []}

    # Hash every image file
    hash_map: dict[str, list[Path]] = defaultdict(list)
    for f in UPLOAD_DIR.iterdir():
        if f.suffix.lower() in ALLOWED_EXTENSIONS:
            h = hashlib.md5(f.read_bytes()).hexdigest()
            hash_map[h].append(f)

    # Find which URLs are referenced in the news table
    referenced: set[str] = set()
    async for db in get_db():
        rows = await db.execute(sa_text("SELECT image FROM news WHERE image != ''"))
        for (url,) in rows.fetchall():
            fname = url.split("/uploads/")[-1]
            referenced.add(fname)

    deleted: list[str] = []
    kept: list[str] = []

    for files in hash_map.values():
        if len(files) <= 1:
            kept.append(files[0].name)
            continue
        # Prefer referenced file; otherwise keep oldest (smallest mtime)
        files_sorted = sorted(files, key=lambda f: (f.name not in referenced, f.stat().st_mtime))
        keep = files_sorted[0]
        kept.append(keep.name)
        for dup in files_sorted[1:]:
            dup.unlink()
            deleted.append(dup.name)

    return {"deleted": deleted, "kept": kept, "removed_count": len(deleted)}
