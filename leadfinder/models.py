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
        """Чем больше — тем интереснее как клиент."""
        base = {"no_site": 100, "social_only": 90, "bad_site": 70, "unchecked": 40, "ok": 0}[self.kind]
        if self.kind == "bad_site" and self.audit:
            base += (100 - self.audit.score) // 5
        if self.phone:
            base += 8
        if self.socials:
            base += 3
        return base
