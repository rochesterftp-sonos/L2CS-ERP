import uuid as _uuid

from uuid6 import uuid7 as _uuid7


def new_id() -> _uuid.UUID:
    return _uuid7()
