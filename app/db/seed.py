"""Idempotent seed data. Run manually with `python -m app.db.seed`.

Cars in CARS are served even when their model is a placeholder; missing GLBs use the named frontend fallback.
To add a model, drop `<slug>.glb` into assets/models/ and re-run the seed. Unlisted cars are deactivated automatically."""
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.db.database import Base, SessionLocal, engine
from app.models import (
    AeroPackage, Caliper, Car, Configuration, Engine, InteriorColor, InteriorMaterial,
    Paint, PerformancePackage, SeatType, Wheel,
)

CARS = [
    dict(
        name="Porsche 911 GT3 RS",
        slug="porsche-911-gt3-rs",
        base_price=35_000_000,
        horsepower=525,
        top_speed=296,
        acceleration=3.2,
        handling=98,
        braking=97,
        image_url="/assets/porsche-911-gt3-rs.png",
        model_url="/assets/models/porsche-911-gt3-rs.glb",
        description="Uncompromising track-bred sports car with naturally aspirated flat-six power, central radiator concept, and extreme active aerodynamics.",
    ),
    dict(
        name="Suzuki Swift",
        slug="suzuki-swift",
        base_price=849_000,
        horsepower=82,
        top_speed=165,
        acceleration=12.5,
        handling=72,
        braking=70,
        image_url="/assets/suzuki-swift.png",
        model_url="/assets/models/suzuki-swift.glb",
        description="Light, nimble Japanese hatchback with a 1.2L three-cylinder petrol engine, efficient packaging and agile city handling.",
    ),
    dict(
        name="Apex F1-GT",
        slug="apex-f1gt",
        base_price=125_000_000,
        horsepower=980,
        top_speed=360,
        acceleration=2.4,
        handling=99,
        braking=98,
        image_url="/assets/thumbnails/apex-f1gt.png",
        model_url="/assets/models/apex-f1gt.glb",
        description="A street-legal hypercar heavily inspired by current Formula 1 aerodynamics and material science.",
    ),
]

PAINTS = [
    dict(
        name="Obsidian Black",
        hex_code="#080808",
        price_modifier=0,
        category="solid",
    ),
    dict(
        name="Pearl White",
        hex_code="#F5F5F0",
        price_modifier=150_000,
        category="pearl",
    ),
    dict(
        name="Racing Red",
        hex_code="#C8102E",
        price_modifier=200_000,
        category="metallic",
    ),
    dict(
        name="Electric Blue",
        hex_code="#0A5CFF",
        price_modifier=250_000,
        category="metallic",
    ),
    dict(
        name="Neon Green",
        hex_code="#39FF14",
        price_modifier=300_000,
        category="special",
    ),
    dict(
        car_slug="apex-f1gt",
        name="Apex Satin Graphite",
        hex_code="#555b5c",
        price_modifier=450_000,
        category="satin metallic",
    ),
]

WHEELS = [
    dict(
        name="Aero",
        description="Closed-face aero wheels for reduced drag.",
        price_modifier=100_000,
    ),
    dict(
        name="Carbon",
        description="Lightweight full carbon-fibre wheels.",
        price_modifier=450_000,
    ),
    dict(
        name="Forged",
        description="Forged alloy wheels with a classic multi-spoke design.",
        price_modifier=300_000,
    ),
    dict(
        name="Performance",
        description="Track-focused wheels with a wide contact patch.",
        price_modifier=200_000,
    ),
]

CALIPERS = [
    dict(
        name="Red",
        hex_code="#D00000",
        price_modifier=25_000,
    ),
    dict(
        name="Yellow",
        hex_code="#FFD60A",
        price_modifier=25_000,
    ),
    dict(
        name="Blue",
        hex_code="#1E6FFF",
        price_modifier=25_000,
    ),
    dict(
        name="Black",
        hex_code="#111111",
        price_modifier=0,
    ),
]

MATERIALS = [
    dict(
        name="Leather",
        description="Hand-stitched premium leather.",
        price_modifier=200_000,
    ),
    dict(
        name="Alcantara",
        description="Grippy suede-like microfibre.",
        price_modifier=350_000,
    ),
    dict(
        name="Carbon",
        description="Exposed carbon-fibre with minimal trim.",
        price_modifier=600_000,
    ),
]

INTERIOR_COLORS = [
    dict(
        name="Black",
        hex_code="#101010",
        price_modifier=0,
    ),
    dict(
        name="White",
        hex_code="#F2F2F2",
        price_modifier=0,
    ),
    dict(
        name="Red",
        hex_code="#B3122B",
        price_modifier=50_000,
    ),
    dict(
        name="Tan",
        hex_code="#B08968",
        price_modifier=50_000,
    ),
]

SEATS = [
    dict(
        name="Sport",
        description="Supportive everyday sport seats.",
        price_modifier=0,
    ),
    dict(
        name="Racing",
        description="Fixed-back carbon racing shells with harness points.",
        price_modifier=250_000,
    ),
    dict(
        name="Luxury",
        description="Heated, ventilated, massaging comfort seats.",
        price_modifier=400_000,
    ),
]

ENGINES = [
    dict(
        car_slug="porsche-911-gt3-rs",
        name="4.0L Naturally Aspirated Flat-Six",
        description="High-revving atmospheric 4.0L six-cylinder boxer producing 525 hp at 9,000 RPM.",
        price_modifier=0,
        horsepower_modifier=0,
        top_speed_modifier=0,
        acceleration_modifier=0.0,
        handling_modifier=0,
        braking_modifier=0,
    ),
    dict(
        car_slug="porsche-911-gt3-rs",
        name="4.0L Flat-Six Weissach Power Spec",
        description="Lightweight titanium valvetrain and sport exhaust delivering 545 hp.",
        price_modifier=1_800_000,
        horsepower_modifier=20,
        top_speed_modifier=4,
        acceleration_modifier=-0.1,
        handling_modifier=1,
        braking_modifier=0,
    ),
    dict(
        car_slug="suzuki-swift",
        name="1.2L Z-Series Three-Cylinder",
        description="Standard 1.2L three-cylinder petrol engine producing 82 hp.",
        price_modifier=0,
        horsepower_modifier=0,
        top_speed_modifier=0,
        acceleration_modifier=0.0,
        handling_modifier=0,
        braking_modifier=0,
    ),
    dict(
        car_slug="suzuki-swift",
        name="1.2L Z-Series Sport Tune",
        description="Remapped ECU and free-flow intake for 88 hp and sharper response.",
        price_modifier=45_000,
        horsepower_modifier=6,
        top_speed_modifier=4,
        acceleration_modifier=-0.4,
        handling_modifier=0,
        braking_modifier=0,
    ),
    dict(
        car_slug="apex-f1gt",
        name="2.4L V6 Hybrid ERS",
        description="High-revving V6 paired with an energy recovery system for sustained electrical boost.",
        price_modifier=4_500_000,
        horsepower_modifier=180,
        top_speed_modifier=24,
        acceleration_modifier=-0.3,
        handling_modifier=1,
        braking_modifier=0,
    ),
]

PACKAGES = [
    dict(
        car_slug="porsche-911-gt3-rs",
        name="Clubsport Package",
        description="Track-ready road calibration with steel roll-cage prep.",
        price_modifier=0,
        horsepower_modifier=0,
        top_speed_modifier=0,
        acceleration_modifier=0.0,
        handling_modifier=0,
        braking_modifier=0,
    ),
    dict(
        car_slug="porsche-911-gt3-rs",
        name="Weissach Package",
        description="Carbon-weave anti-roll bars, magnesium suspension components, and track brakes.",
        price_modifier=3_500_000,
        horsepower_modifier=50,
        top_speed_modifier=5,
        acceleration_modifier=-0.1,
        handling_modifier=8,
        braking_modifier=8,
    ),
    dict(
        car_slug="suzuki-swift",
        name="Standard City Setup",
        description="Comfort-focused road calibration.",
        price_modifier=0,
        horsepower_modifier=0,
        top_speed_modifier=0,
        acceleration_modifier=0.0,
        handling_modifier=0,
        braking_modifier=0,
    ),
    dict(
        car_slug="suzuki-swift",
        name="Sport Handling Package",
        description="Stiffer springs, front strut brace and upgraded brake pads.",
        price_modifier=60_000,
        horsepower_modifier=0,
        top_speed_modifier=0,
        acceleration_modifier=0.0,
        handling_modifier=6,
        braking_modifier=4,
    ),
    dict(
        car_slug="apex-f1gt",
        name="Apex F1-Track Performance Pack",
        description="Track calibration, active chassis control and qualifying-mode energy deployment.",
        price_modifier=3_200_000,
        horsepower_modifier=90,
        top_speed_modifier=12,
        acceleration_modifier=-0.2,
        handling_modifier=4,
        braking_modifier=3,
    ),
    dict(
        car_slug="apex-f1gt",
        name="Carbon-Ceramic Brake System",
        description="Lightweight carbon-ceramic rotors with endurance-grade cooling ducts.",
        price_modifier=1_400_000,
        horsepower_modifier=0,
        top_speed_modifier=0,
        acceleration_modifier=0.0,
        handling_modifier=0,
        braking_modifier=8,
    ),
]

AEROS = [
    dict(
        car_slug="porsche-911-gt3-rs",
        name="Standard GT3 RS Aero",
        description="Factory carbon swan-neck rear wing and front diffuser blades.",
        price_modifier=0,
        downforce=0,
        drag=0,
        handling_modifier=0,
        top_speed_modifier=0,
    ),
    dict(
        car_slug="porsche-911-gt3-rs",
        name="Active DRS Aero Package",
        description="Hydraulic Drag Reduction System (DRS) with active upper wing flap and underfloor diffuser flaps.",
        price_modifier=900_000,
        downforce=30,
        drag=10,
        handling_modifier=8,
        top_speed_modifier=-3,
    ),
    dict(
        car_slug="suzuki-swift",
        name="Standard Bodywork",
        description="Factory bodywork with roof-end spoiler.",
        price_modifier=0,
        downforce=0,
        drag=0,
        handling_modifier=0,
        top_speed_modifier=0,
    ),
    dict(
        car_slug="suzuki-swift",
        name="Sport Body Kit",
        description="Front lip, side skirts and rear under-spoiler.",
        price_modifier=40_000,
        downforce=4,
        drag=1,
        handling_modifier=2,
        top_speed_modifier=-1,
    ),
    dict(
        car_slug="apex-f1gt",
        name="Apex Ground-Effect Aero Package",
        description="Full-width venturi tunnels and adjustable carbon-fiber ground-effect elements.",
        price_modifier=2_800_000,
        downforce=48,
        drag=12,
        handling_modifier=7,
        top_speed_modifier=-5,
    ),
]


def _ensure_schema(db: Session) -> None:
    """Add compatibility columns when running against an existing SQLite database."""
    tables = [
        "paints", "wheels", "calipers", "interior_materials",
        "interior_colors", "seat_types", "engines", "performance_packages", "aero_packages",
    ]
    for table in tables:
        try:
            res = db.execute(text(f"PRAGMA table_info({table})")).fetchall()
            columns = [r[1] for r in res]
            if columns and "car_id" not in columns:
                db.execute(text(f"ALTER TABLE {table} ADD COLUMN car_id INTEGER REFERENCES cars(id)"))
                db.commit()
        except Exception:
            pass
    try:
        res = db.execute(text("PRAGMA table_info(cars)")).fetchall()
        columns = [r[1] for r in res]
        if columns and "model_url" not in columns:
            db.execute(text("ALTER TABLE cars ADD COLUMN model_url VARCHAR(255) NOT NULL DEFAULT ''"))
            db.commit()
    except Exception:
        pass


def _cleanup_fictional_data(db: Session) -> None:
    """Safely remove or deactivate legacy fictional cars and options."""
    # Fictional cars
    for slug in ("vortex-x1", "apex-r", "phantom-gt"):
        old_car = db.scalar(select(Car).where(Car.slug == slug))
        if old_car:
            has_cfg = db.scalar(select(Configuration.id).where(Configuration.car_id == old_car.id))
            if has_cfg:
                old_car.is_active = False
            else:
                db.delete(old_car)

    # Legacy fictional options if unreferenced
    legacy_options = {
        Engine: ("V8", "V10", "V12", "Hybrid"),
        PerformancePackage: ("Street", "Track", "Race"),
        AeroPackage: ("Stock", "Sport", "Extreme"),
    }
    for model, names in legacy_options.items():
        fk = {
            Engine: Configuration.engine_id,
            PerformancePackage: Configuration.performance_package_id,
            AeroPackage: Configuration.aero_package_id,
        }[model]
        for opt in db.scalars(select(model).where(model.name.in_(names))).all():
            has_cfg = db.scalar(select(Configuration.id).where(fk == opt.id))
            if has_cfg:
                opt.is_active = False
            else:
                db.delete(opt)

    db.flush()


def _sync_active_cars(db: Session) -> None:
    """Serve exactly the cars listed in CARS; deactivate the rest (kept, not deleted, so saved builds still resolve)."""
    served = {c["slug"] for c in CARS}
    for car in db.scalars(select(Car)).all():
        car.is_active = car.slug in served
    db.flush()


def _seed_table(db: Session, model, rows: list[dict], key: str = "name") -> int:
    existing = set(db.scalars(select(getattr(model, key))).all())
    created = 0
    for row in rows:
        if row[key] not in existing:
            db.add(model(**row))
            created += 1
    return created


def seed_database(db: Session) -> int:
    """Insert missing seed rows and link vehicle options. Safe to call repeatedly."""
    _ensure_schema(db)
    _cleanup_fictional_data(db)

    total = 0
    total += _seed_table(db, Car, CARS, key="slug")
    db.flush()
    for car_data in CARS:
        car = db.scalar(select(Car).where(Car.slug == car_data["slug"]))
        if car:
            for field, value in car_data.items():
                if getattr(car, field) != value:
                    setattr(car, field, value)
    _sync_active_cars(db)

    car_slug_to_id = {c.slug: c.id for c in db.scalars(select(Car)).all()}

    def _prepare_rows(row_list: list[dict]) -> list[dict]:
        prepared = []
        for r in row_list:
            item = dict(r)
            if "car_slug" in item:
                slug = item.pop("car_slug")
                item["car_id"] = car_slug_to_id.get(slug)
            prepared.append(item)
        return prepared

    for model, rows in (
        (Paint, _prepare_rows(PAINTS)),
        (Wheel, WHEELS),
        (Caliper, CALIPERS),
        (InteriorMaterial, MATERIALS),
        (InteriorColor, INTERIOR_COLORS),
        (SeatType, SEATS),
        (Engine, _prepare_rows(ENGINES)),
        (PerformancePackage, _prepare_rows(PACKAGES)),
        (AeroPackage, _prepare_rows(AEROS)),
    ):
        total += _seed_table(db, model, rows)

    db.commit()
    return total


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        print(f"Seeded {seed_database(session)} new rows.")
