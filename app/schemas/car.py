from pydantic import BaseModel, ConfigDict


class CarOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str
    base_price: int
    horsepower: int
    top_speed: int
    acceleration: float
    handling: int
    braking: int
    image_url: str
    model_url: str
