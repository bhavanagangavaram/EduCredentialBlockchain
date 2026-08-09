import os, csv

dataset_path = "d:/FinalProj/dataset"
output_csv   = "d:/FinalProj/coercion_dataset.csv"

with open(output_csv, 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['video_path', 'label'])
    
    for label_name, label in [('normal',0),('coerced',1),('empty',2)]:
        folder = os.path.join(dataset_path, label_name)
        for video in sorted(os.listdir(folder)):
            if video.endswith('.mp4'):
                writer.writerow([
                    os.path.join(folder, video),
                    label
                ])

print("✅ CSV created!")
print(f"Saved: {output_csv}")