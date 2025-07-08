# Generated manually to fix booking table issue
from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0009_add_booking_model_and_improve_room'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Drop and recreate the booking table to ensure it exists with correct schema
        migrations.RunSQL(
            sql=[
                "DROP TABLE IF EXISTS accounts_booking CASCADE;",
                """
                CREATE TABLE accounts_booking (
                    id SERIAL PRIMARY KEY,
                    booking_date DATE NOT NULL,
                    start_time TIME NOT NULL,
                    end_time TIME NOT NULL,
                    purpose VARCHAR(200),
                    status VARCHAR(20) NOT NULL DEFAULT 'pending',
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    room_id INTEGER NOT NULL REFERENCES accounts_room(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
                    UNIQUE(room_id, booking_date, start_time, end_time)
                );
                """,
                "CREATE INDEX accounts_booking_room_id_idx ON accounts_booking(room_id);",
                "CREATE INDEX accounts_booking_user_id_idx ON accounts_booking(user_id);",
                "CREATE INDEX accounts_booking_date_idx ON accounts_booking(booking_date);",
            ],
            reverse_sql=[
                "DROP TABLE IF EXISTS accounts_booking CASCADE;",
            ]
        ),
    ]
