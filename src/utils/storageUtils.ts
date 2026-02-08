import { supabase } from "@/integrations/supabase/client";

export async function uploadPaper(file: File, userId: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
        .from('papers')
        .upload(filePath, file);

    if (error) {
        // If bucket doesn't exist, we might need to handle that or assume it exists
        throw error;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('papers')
        .getPublicUrl(filePath);

    return publicUrl;
}
