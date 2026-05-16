
REVOKE EXECUTE ON FUNCTION public.log_artifact_interaction() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_vote_interaction() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_reaction_interaction() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_lock_interaction() FROM PUBLIC, anon, authenticated;
