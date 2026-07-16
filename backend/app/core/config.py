# app/core/config.py

class LibraryConfig:
    def __init__(self):
        # Your global variables
        self._max_books_per_member = 5
        self._maintenance_mode = False

    # Getter methods (Read-only access)
    @property
    def max_books_per_member(self):
        return self._max_books_per_member

    @property
    def maintenance_mode(self):
        return self._maintenance_mode

    # Setter methods (Controlled operations)
    def update_max_books(self, new_limit: int):
        if new_limit < 0:
            raise ValueError("Limit cannot be negative")
        self._max_books_per_member = new_limit

    def toggle_maintenance(self):
        self._maintenance_mode = not self._maintenance_mode

# Initialize the global instance
# This is a singleton instance that gets shared when imported
library_settings = LibraryConfig()