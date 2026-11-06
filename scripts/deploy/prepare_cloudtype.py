"""Turn Cloudtype's exported service YAML into an exact-commit deployment."""
import json
import os
from pathlib import Path
import sys

import yaml

TARGETS = {"api": ("black-swan-api", "Dockerfile"), "scraper": ("black-swan-scraper", "Dockerfile.worker")}


def prepare(raw, target, repository, sha):
    config = yaml.safe_load(raw)
    name, dockerfile = TARGETS[target]
    if not isinstance(config, dict) or config.get("name") != name or config.get("app") != "dockerfile":
        raise ValueError("Export the service YAML from the intended Cloudtype service's CLI tab")
    options = config.get("options")
    if not isinstance(options, dict) or options.get("dockerfile") != dockerfile:
        raise ValueError("Unexpected Dockerfile setting")
    env = options.get("env", [])
    if not isinstance(env, list) or not all(isinstance(item, dict) and "name" in item and "value" in item for item in env):
        raise ValueError("Expected options.env entries with name and value")
    if not any(item["name"] == "DATABASE_URL" and item["value"] for item in env):
        raise ValueError("DATABASE_URL must be preserved in the exported service configuration")
    options["env"] = [item for item in env if item["name"] != "DEPLOY_COMMIT_SHA"] + [{"name": "DEPLOY_COMMIT_SHA", "value": sha}]
    # Keep resources, environment variables, ports and other existing service settings.
    context = config.setdefault("context", {})
    context["git"] = {"url": f"git@github.com:{repository}.git", "ref": sha}
    # This monorepo's Dockerfiles require the repository root as build context.
    context.pop("path", None)
    context["preset"] = "dockerfile"
    return config


def main():
    target = sys.argv[1]
    config = prepare(os.environ["CLOUDTYPE_SERVICE_YAML"], target, os.environ["GITHUB_REPOSITORY"], os.environ["GITHUB_SHA"])
    # Mask individual values as well as the original multiline GitHub secret.
    for entry in config["options"]["env"]:
        value = str(entry["value"])
        if value and entry["name"] != "DEPLOY_COMMIT_SHA":
            escaped = value.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
            print(f"::add-mask::{escaped}")
    output = Path(os.environ["RUNNER_TEMP"]) / f"cloudtype-{target}.json"
    descriptor = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(descriptor, "w") as stream:
        json.dump(config, stream)
    with open(os.environ["GITHUB_OUTPUT"], "a") as stream:
        stream.write(f"file={os.path.relpath(output)}\n")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # YAML parse errors can contain source lines with credentials.
        print("::error::Invalid Cloudtype service configuration; check the YAML secret and deployment inputs.", file=sys.stderr)
        sys.exit(1)
