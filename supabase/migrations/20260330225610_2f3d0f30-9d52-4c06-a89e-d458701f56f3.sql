WITH ranked_feedback AS (
  SELECT
    id,
    meetup_id,
    given_by,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY meetup_id, given_by
      ORDER BY created_at ASC, id ASC
    ) AS row_num
  FROM public.feedback
)
DELETE FROM public.feedback f
USING ranked_feedback rf
WHERE f.id = rf.id
  AND rf.row_num > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_feedback_meetup_given_by
  ON public.feedback (meetup_id, given_by);
