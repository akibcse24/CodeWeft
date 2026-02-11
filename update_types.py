
import json
import os

input_path = r"C:/Users/Qbits/.gemini/antigravity/brain/b8aef8e2-6c26-4073-baeb-701e97c1f662/.system_generated/steps/135/output.txt"
output_path = r"g:/cw/src/integrations/supabase/types.ts"

try:
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        types_content = data["types"]

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(types_content)

    print(f"Successfully wrote types to {output_path}")

except Exception as e:
    print(f"Error: {e}")
