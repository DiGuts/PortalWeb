"""Attach external TAVIL images to existing news rows."""
import asyncio
from sqlalchemy import text
from database import engine


MAPPING = [
    (
        "Nova línia multiformat amb canvi automàtic en menys de 4 segons",
        "https://tavil.com/actualidad/wp-content/uploads/2025/06/mult-1024x556.webp",
    ),
    (
        "Visita institucional de l'Institut Pla de l'Estany a la planta de Begudà",
        "https://tavil.com/wp-content/uploads/2023/04/DSC01115-1.jpg",
    ),
    (
        "TAVIL estarà present a Hispack 2026 — pavelló 2, estand D-114",
        "https://tavil.com/actualidad/wp-content/uploads/2025/09/Captura-de-Pantalla-2025-09-17-a-les-15.24.02-1024x558.png",
    ),
]


async def main():
    async with engine.begin() as conn:
        updated = 0
        for title, image in MAPPING:
            res = await conn.execute(
                text("UPDATE news SET image = :image WHERE title = :title"),
                {"image": image, "title": title},
            )
            if res.rowcount:
                updated += res.rowcount
                print(f"[OK] {title[:60]}...")
            else:
                print(f"[NOT FOUND] {title[:60]}...")
        print(f"Total updated: {updated}")


if __name__ == "__main__":
    asyncio.run(main())
