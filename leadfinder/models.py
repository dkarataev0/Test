from pydantic import BaseModel, Field


class Audit(BaseModel):
    score: int = 0
    reachable: bool = False
    final_url: str | None = None
    load_time: float | None = None
    issues: list[str] = Field(default_factory=list)
    checks: dict[str, bool] = Field(default_factory=dict)


class Company(BaseModel):
    id: str
    name: str
    niche: str
    category: str
    address: str | None = None
    city: str | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    socials: dict[str, str] = Field(default_factory=dict)
    opening_hours: str | None = None
    lat: float | None = None
    lon: float | None = None
    # no_site | social_only | bad_site | ok | unchecked
    kind: str = "unchecked"
    audit: Audit | None = None
    status: str = "new"
    note: str = ""
    demo: bool = False

    @property
    def priority(self) -> int:
        """Чем больше - тем интереснее как клиент.

        Выше всех те, у кого есть только соцсети: они уже вкладываются в продвижение,
        им проще объяснить пользу сайта. Дальше - без сайта, потом со слабым сайтом.
        Внутри группы выше те, с кем можно связаться прямо сейчас.
        """
        base = {"social_only": 100, "no_site": 80, "bad_site": 60, "unchecked": 40, "ok": 0}[self.kind]
        if self.kind == "bad_site" and self.audit:
            base += (100 - self.audit.score) // 10
        if self.phone:
            base += 10
        if self.socials.get("telegram") or self.socials.get("whatsapp"):
            base += 8
        if self.socials:
            base += 4
        if not self.phone and not self.socials and not self.email:
            base -= 25  # не с кем связаться
        return base
