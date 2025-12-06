-- Create table for chat conversations
CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Users can insert their own conversations
CREATE POLICY "Users can insert their own chat conversations"
ON public.chat_conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users can update their own chat conversations"
ON public.chat_conversations
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can view their own conversations
CREATE POLICY "Users can view their own chat conversations"
ON public.chat_conversations
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all conversations
CREATE POLICY "Admins can view all chat conversations"
ON public.chat_conversations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_chat_conversations_updated_at
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();