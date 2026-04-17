"""Seed polished TAVIL-themed news into the database.

Usage (from backend/ with venv active):
    python seed_news.py

Idempotent: skips inserting titles that already exist.
"""
import asyncio
from datetime import date, timedelta
from sqlalchemy import text
from database import engine


TODAY = date(2026, 4, 17)


def d(days_ago: int) -> str:
    return (TODAY - timedelta(days=days_ago)).isoformat()


NEWS = [
    # ── Innovació ────────────────────────────────────────────────────────────
    {
        "category": "Innovació",
        "title": "Nova línia multiformat amb canvi automàtic en menys de 4 segons",
        "summary": "La nova generació de formadores de caixes TAVIL emmagatzema fins a 99 formats i canvia entre ells sense aturar la línia.",
        "content": (
            "El departament d'R+D de TAVIL ha presentat la nova generació de formadores "
            "de caixes multiformat, capaç d'emmagatzemar fins a 99 configuracions "
            "diferents i canviar entre elles en menys de 4 segons sense intervenció de "
            "l'operari. Aquesta millora permet als clients del sector alimentari "
            "adaptar-se en temps real a comandes curtes sense penalitzar la "
            "productivitat de la línia.\n\n"
            "La solució ja s'ha desplegat amb èxit en dues plantes pilot a Europa i "
            "s'integrarà per defecte a les noves instal·lacions a partir del segon "
            "semestre de 2026."
        ),
        "author": "Departament R+D",
        "date": d(3),
        "image": "",
        "featured": 1,
    },
    {
        "category": "Innovació",
        "title": "Integració de visió artificial per al control de qualitat en paletització",
        "summary": "Les noves cel·les robotitzades incorporen càmeres amb IA per detectar defectes de format en temps real.",
        "content": (
            "Les cel·les de paletització que sortiran a partir d'aquest trimestre "
            "inclouran un sistema de visió artificial entrenat per detectar caixes "
            "malformades, etiquetes incorrectes o paletitzats irregulars abans "
            "d'arribar al film estirable. El sistema redueix rebuigs i millora la "
            "traçabilitat end-to-end sense alentir el cicle."
        ),
        "author": "Enginyeria",
        "date": d(10),
        "image": "",
        "featured": 0,
    },

    # ── Notícies corporatives ────────────────────────────────────────────────
    {
        "category": "Notícies corporatives",
        "title": "TAVIL tanca el primer trimestre amb un creixement del 12% en comandes internacionals",
        "summary": "La demanda de línies multiformat a Europa i Amèrica del Nord impulsa els resultats del Q1 2026.",
        "content": (
            "El primer trimestre de 2026 s'ha tancat amb un creixement del 12% en "
            "volum de comandes respecte al mateix període de l'any anterior, "
            "principalment gràcies a l'expansió de clients al sector de begudes "
            "vegetals i productes càrnics envasats. Direcció agraeix a tots els "
            "equips d'enginyeria, producció i postvenda l'esforç sostingut."
        ),
        "author": "Direcció General",
        "date": d(1),
        "image": "",
        "featured": 1,
    },
    {
        "category": "Notícies corporatives",
        "title": "Visita institucional de l'Institut Pla de l'Estany a la planta de Begudà",
        "summary": "Una seixantena d'alumnes van conèixer el procés complet de disseny i muntatge d'una línia TAVIL.",
        "content": (
            "Dimecres passat TAVIL va rebre la visita d'alumnes de cicles formatius "
            "de l'Institut Pla de l'Estany. Els estudiants van recórrer les àrees "
            "de disseny mecànic, muntatge i proves finals, i van poder veure en "
            "funcionament una línia multiformat abans del seu embarcament a "
            "Alemanya. Iniciatives com aquesta reforcen el vincle amb el territori "
            "i l'atracció de talent jove."
        ),
        "author": "Comunicació",
        "date": d(7),
        "image": "",
        "featured": 0,
    },
    {
        "category": "Notícies corporatives",
        "title": "Nova fase d'ampliació del taller de muntatge a Sant Joan les Fonts",
        "summary": "L'obra afegirà 1.200 m² i dues àrees de proves addicionals per absorbir el creixement de comandes.",
        "content": (
            "Les obres de la nova fase d'ampliació del taller de muntatge ja han "
            "començat al Pla de Begudà. El projecte contempla 1.200 m² nous, dues "
            "àrees de proves addicionals amb alimentació elèctrica independent i "
            "una zona de preparació logística millorada. La previsió és que "
            "l'ampliació entri en servei abans de final d'any."
        ),
        "author": "Direcció d'Operacions",
        "date": d(14),
        "image": "",
        "featured": 0,
    },

    # ── Esdeveniments ────────────────────────────────────────────────────────
    {
        "category": "Esdeveniments",
        "title": "TAVIL estarà present a Hispack 2026 — pavelló 2, estand D-114",
        "summary": "Del 19 al 22 de maig, a Fira de Barcelona, mostrarem en directe la nova formadora multiformat.",
        "content": (
            "Un any més, TAVIL participarà a Hispack, la fira de referència del "
            "packaging al sud d'Europa. Al nostre estand es podrà veure en "
            "funcionament la nova formadora multiformat amb canvi automàtic, així "
            "com una cel·la de paletització robotitzada amb visió artificial. "
            "Els treballadors interessats a assistir poden sol·licitar acreditació "
            "a Comunicació."
        ),
        "author": "Comunicació",
        "date": d(5),
        "image": "",
        "featured": 1,
    },
    {
        "category": "Esdeveniments",
        "title": "Dinar d'equip de primavera — divendres 8 de maig",
        "summary": "Direcció convida a tot l'equip al dinar anual de primavera al Mas les Comes.",
        "content": (
            "Com cada any, celebrem el dinar d'equip de primavera com a punt de "
            "trobada entre departaments. Enguany serà divendres 8 de maig al Mas "
            "les Comes. La sortida serà a les 13:00 des de la recepció. Cal "
            "confirmar assistència a RRHH abans del 30 d'abril per motius "
            "d'organització."
        ),
        "author": "RRHH",
        "date": d(2),
        "image": "",
        "featured": 0,
    },

    # ── Recursos humans ──────────────────────────────────────────────────────
    {
        "category": "Recursos humans",
        "title": "Nou conveni de formació contínua amb el Campus TAVIL",
        "summary": "S'amplia el catàleg intern amb cursos tècnics de PLC, robòtica col·laborativa i lean manufacturing.",
        "content": (
            "A partir d'aquest mes, el Campus TAVIL incorpora 14 nous cursos al "
            "catàleg intern, amb blocs específics de programació PLC, robòtica "
            "col·laborativa, lean manufacturing i comunicació tècnica amb "
            "clients. Les inscripcions estan obertes a la pestanya Campus TAVIL "
            "del portal, i totes les formacions computen dins del pla de "
            "desenvolupament professional anual."
        ),
        "author": "RRHH",
        "date": d(4),
        "image": "",
        "featured": 0,
    },
    {
        "category": "Recursos humans",
        "title": "Incorporacions del mes — benvinguts a l'equip",
        "summary": "Aquest abril s'han incorporat 5 persones noves a Enginyeria, Muntatge i Postvenda.",
        "content": (
            "Aquest mes d'abril donem la benvinguda a cinc nous companys "
            "repartits entre els departaments d'Enginyeria Mecànica, Muntatge "
            "Elèctric i Postvenda. Us animem a saludar-los durant les pauses i "
            "a donar-los suport en la integració. Trobareu les seves fitxes al "
            "Directori del portal."
        ),
        "author": "RRHH",
        "date": d(8),
        "image": "",
        "featured": 0,
    },

    # ── Seguretat ────────────────────────────────────────────────────────────
    {
        "category": "Seguretat",
        "title": "Actualització del protocol de bloqueig i consignació (LOTO)",
        "summary": "Obligatori per a totes les intervencions en línies amb energia pneumàtica o elèctrica residual.",
        "content": (
            "S'ha publicat la revisió 2026 del protocol de bloqueig i "
            "consignació (LOTO). Les principals novetats són la identificació "
            "obligatòria amb etiqueta nominal, la verificació amb segon "
            "operari per a línies amb servos, i el registre digital de cada "
            "operació al terminal del taller. La formació de reciclatge tindrà "
            "lloc a les sessions de seguretat del mes vinent."
        ),
        "author": "Prevenció de Riscos",
        "date": d(6),
        "image": "",
        "featured": 0,
    },
    {
        "category": "Seguretat",
        "title": "Simulacre d'evacuació — dijous 30 d'abril a les 11:00",
        "summary": "Es realitzarà un simulacre d'evacuació complet de les instal·lacions de Begudà.",
        "content": (
            "El proper dijous 30 d'abril es realitzarà un simulacre "
            "d'evacuació complet a les instal·lacions de Begudà. En sentir "
            "l'alarma cal tancar els equips en marxa de manera segura i "
            "dirigir-se al punt de reunió (aparcament exterior nord). Els "
            "responsables de sala coordinaran el recompte."
        ),
        "author": "Prevenció de Riscos",
        "date": d(11),
        "image": "",
        "featured": 0,
    },

    # ── Comunicats interns ───────────────────────────────────────────────────
    {
        "category": "Comunicats interns",
        "title": "Tancament del pàrquing nord per manteniment — dilluns 21",
        "summary": "El pàrquing nord estarà inutilitzat tot el dia. Feu servir el pàrquing sud o l'esplanada est.",
        "content": (
            "Per treballs de reasfaltat, el pàrquing nord quedarà tancat "
            "dilluns 21 d'abril durant tota la jornada. Recomanem avançar "
            "l'arribada i fer servir el pàrquing sud o l'esplanada est. "
            "Gràcies per la comprensió."
        ),
        "author": "Serveis Generals",
        "date": d(0),
        "image": "",
        "featured": 0,
    },
    {
        "category": "Comunicats interns",
        "title": "Nova adreça per a gestions de vacances: taviltime@tavil.net",
        "summary": "Totes les sol·licituds i consultes de vacances s'han de canalitzar per aquesta nova adreça.",
        "content": (
            "A partir d'ara, totes les sol·licituds i consultes relacionades "
            "amb vacances s'han de canalitzar a l'adreça "
            "taviltime@tavil.net. Recordeu també que podeu fer el seguiment "
            "des de la pestanya Sol·licituds > Vacances del portal."
        ),
        "author": "RRHH",
        "date": d(9),
        "image": "",
        "featured": 0,
    },
]


async def main():
    async with engine.begin() as conn:
        existing = (await conn.execute(text("SELECT title FROM news"))).scalars().all()
        existing_set = set(existing)
        inserted = 0
        skipped = 0
        for n in NEWS:
            if n["title"] in existing_set:
                skipped += 1
                continue
            await conn.execute(
                text("""
                    INSERT INTO news (category, title, summary, content, author, date, image, featured)
                    VALUES (:category, :title, :summary, :content, :author, :date, :image, :featured)
                """),
                n,
            )
            inserted += 1
        print(f"Inserted: {inserted}  |  Skipped (already present): {skipped}")


if __name__ == "__main__":
    asyncio.run(main())
