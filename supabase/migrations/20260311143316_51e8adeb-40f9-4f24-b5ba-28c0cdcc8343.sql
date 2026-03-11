
CREATE OR REPLACE FUNCTION public.spend_credits(_user_id uuid, _amount integer, _description text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _current_balance integer;
  _new_balance integer;
BEGIN
  -- Lock row for atomic update
  SELECT balance INTO _current_balance
  FROM public.user_credits
  WHERE user_id = _user_id
  FOR UPDATE;

  IF _current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_credits_record');
  END IF;

  IF _current_balance < _amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_credits', 'balance', _current_balance);
  END IF;

  _new_balance := _current_balance - _amount;

  UPDATE public.user_credits
  SET balance = _new_balance, updated_at = now()
  WHERE user_id = _user_id;

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (_user_id, -_amount, 'spent', _description);

  RETURN jsonb_build_object('success', true, 'new_balance', _new_balance);
END;
$$;
