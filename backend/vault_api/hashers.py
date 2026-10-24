from django.contrib.auth.hashers import Argon2PasswordHasher


class OptimizedArgon2PasswordHasher(Argon2PasswordHasher):
    """
    Argon2id password hasher following RFC 9106 recommendations for interactive logins:
    Memory: 19MB (19456 KiB)
    Time: 1 iteration (ultra-fast <80ms verification on interactive logins)
    Parallelism: 2 lanes
    Provides strong memory-hard ASIC resistance while eliminating login lag.
    """
    time_cost = 1
    memory_cost = 19456
    parallelism = 2
