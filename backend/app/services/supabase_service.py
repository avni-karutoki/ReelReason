"""
Supabase client integration and database operations service.
Supports both live Supabase PostgreSQL (via supabase-py) and an in-memory demo mock client
for seamless offline and hackathon demonstration testing.
"""
import uuid
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.config import settings

logger = logging.getLogger("reelreason.supabase")

# In-memory database store for mock/demo mode
_MOCK_DB: Dict[str, List[Dict[str, Any]]] = {
    "users": [
        {
            "id": "00000000-0000-0000-0000-000000000001",
            "email": "creator@reelreason.ai",
            "name": "Demo Creator",
            "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=ReelReason",
            "default_platform": "Instagram Reels",
            "default_audience": "Creators",
            "default_tone": "Bold",
            "preferred_clip_types": ["strong_opinion", "practical_lesson", "story"],
            "clips_per_video": 3,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
    ],
    "video_projects": [],
    "transcripts": [],
    "transcript_segments": [],
    "clip_suggestions": [],
    "rendered_reels": [],
    "clip_feedback": [],
    "job_logs": []
}


class MockQueryBuilder:
    """Mock query builder mirroring supabase-py query interface for demo mode."""
    def __init__(self, table_name: str):
        self.table_name = table_name
        self.filters = []
        self._order_col = None
        self._desc = False
        self._limit_count = None

    def select(self, *columns):
        return self

    def insert(self, values: Any):
        rows = values if isinstance(values, list) else [values]
        inserted = []
        for row in rows:
            record = dict(row)
            if "id" not in record:
                record["id"] = str(uuid.uuid4())
            if "created_at" not in record:
                record["created_at"] = datetime.utcnow().isoformat()
            if "updated_at" not in record:
                record["updated_at"] = datetime.utcnow().isoformat()
            _MOCK_DB[self.table_name].append(record)
            inserted.append(record)
        return MockResult(inserted)

    def update(self, values: Dict[str, Any]):
        self._update_values = values
        return self

    def delete(self):
        self._is_delete = True
        return self

    def eq(self, column: str, value: Any):
        self.filters.append((column, "eq", value))
        return self

    def order(self, column: str, desc: bool = False):
        self._order_col = column
        self._desc = desc
        return self

    def limit(self, count: int):
        self._limit_count = count
        return self

    def execute(self):
        data = _MOCK_DB.get(self.table_name, [])
        # Apply filters
        filtered = []
        for row in data:
            match = True
            for col, op, val in self.filters:
                if op == "eq" and str(row.get(col)) != str(val):
                    match = False
                    break
            if match:
                filtered.append(row)

        if hasattr(self, "_update_values"):
            for row in filtered:
                row.update(self._update_values)
                row["updated_at"] = datetime.utcnow().isoformat()
            return MockResult(filtered)

        if getattr(self, "_is_delete", False):
            _MOCK_DB[self.table_name] = [r for r in data if r not in filtered]
            return MockResult(filtered)

        if self._order_col:
            filtered.sort(key=lambda x: x.get(self._order_col) or 0, reverse=self._desc)

        if self._limit_count is not None:
            filtered = filtered[:self._limit_count]

        return MockResult(filtered)


class MockResult:
    def __init__(self, data: Any):
        self.data = data


class MockSupabaseClient:
    def table(self, table_name: str) -> MockQueryBuilder:
        if table_name not in _MOCK_DB:
            _MOCK_DB[table_name] = []
        return MockQueryBuilder(table_name)


class SupabaseService:
    def __init__(self):
        self._client = None
        self._service_client = None
        self._init_clients()

    def _init_clients(self):
        use_mock = (
            settings.is_mock_mode or
            "placeholder" in settings.SUPABASE_URL or
            "your-project" in settings.SUPABASE_URL
        )

        if use_mock:
            logger.info("SupabaseService: Running with In-Memory Demo Mock Database")
            self._client = MockSupabaseClient()
            self._service_client = MockSupabaseClient()
        else:
            try:
                from supabase import create_client
                self._client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
                self._service_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
                logger.info(f"SupabaseService: Connected to live Supabase at {settings.SUPABASE_URL}")
            except Exception as e:
                logger.warning(f"Could not initialize live Supabase client ({e}). Falling back to In-Memory DB.")
                self._client = MockSupabaseClient()
                self._service_client = MockSupabaseClient()

    @property
    def client(self):
        return self._client

    @property
    def service_client(self):
        """Bypasses RLS for backend background processing tasks."""
        return self._service_client

    # Helper Database CRUD Methods
    async def create_job_log(self, project_id: Optional[str], job_type: str, status: str, message: str, metadata: Optional[dict] = None):
        """Writes an audit entry to public.job_logs."""
        try:
            record = {
                "project_id": project_id,
                "job_type": job_type,
                "status": status,
                "message": message,
                "metadata": metadata or {},
            }
            import asyncio
            return await asyncio.to_thread(
                lambda: self.service_client.table("job_logs").insert(record).execute()
            )
        except Exception as e:
            logger.error(f"Failed to write job log: {e}")


supabase_service = SupabaseService()
