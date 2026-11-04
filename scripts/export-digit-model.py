"""Export the reviewed digit CNN checkpoint without importing torch or executing pickle.
Only this known state-dict layout is supported. No training or source edits occur.
"""
import argparse, base64, hashlib, json, struct, zipfile
from pathlib import Path

LAYOUT = [
    ("conv1.weight", [32, 1, 3, 3]), ("conv1.bias", [32]),
    ("conv2.weight", [64, 32, 3, 3]), ("conv2.bias", [64]),
    ("fc1.weight", [128, 1600]), ("fc1.bias", [128]),
    ("fc2.weight", [10, 128]), ("fc2.bias", [10]),
]
METADATA_SHA = "a86d56129ba686d30cdebe01e45d1785c652cc3fd9b23d8919f3ad3e7fb6a7a1"

def export_model(checkpoint, output):
    with zipfile.ZipFile(checkpoint) as archive:
        metadata = [n for n in archive.namelist() if n.endswith("/data.pkl")]
        if len(metadata) != 1:
            raise ValueError("Expected exactly one checkpoint state dict")
        prefix = metadata[0][:-len("data.pkl")]
        if hashlib.sha256(archive.read(metadata[0])).hexdigest() != METADATA_SHA:
            raise ValueError("Unknown checkpoint layout; inspect metadata before export")
        if archive.read(prefix + "byteorder") != b"little":
            raise ValueError("Only little-endian float32 storage is supported")
        tensors = []
        for index, (name, shape) in enumerate(LAYOUT):
            raw = archive.read(prefix + "data/" + str(index))
            count = 1
            for dim in shape:
                count *= dim
            if len(raw) != count * 4:
                raise ValueError("Unexpected tensor length: " + name)
            values = struct.unpack("<" + "f" * count, raw)
            if any(not (-1e10 < value < 1e10) for value in values):
                raise ValueError("Invalid weights: " + name)
            tensors.append({"name": name, "shape": shape, "base64": base64.b64encode(raw).decode("ascii")})
    model = {"format": "float32-le", "checkpointSHA256": hashlib.sha256(checkpoint.read_bytes()).hexdigest(), "tensors": tensors}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("/* Original MNIST CNN weights; see docs/DIGIT_MODEL.md. Loaded only inside this project. */\n" +
        "document.currentScript.digitModelData=" + json.dumps(model, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "parameters": sum(len(base64.b64decode(t["base64"])) // 4 for t in tensors), "checkpointSHA256": model["checkpointSHA256"]}))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("checkpoint", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    export_model(args.checkpoint, args.output)
