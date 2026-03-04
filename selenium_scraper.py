import os
import re
from seleniumbase import SB

# Configuration
OUTPUT_DIR = "vex_iq_docs"

# Exact list of API pages to scrape (English, robot-relevant only)
TARGET_URLS = [
    "https://api.vex.com/iq2/home/python/index.html",
    "https://api.vex.com/iq2/home/python/Console.html",
    "https://api.vex.com/iq2/home/python/Controller.html",
    "https://api.vex.com/iq2/home/python/Drivetrain.html",
    "https://api.vex.com/iq2/home/python/Inertial.html",
    "https://api.vex.com/iq2/home/python/Motion/index.html",
    "https://api.vex.com/iq2/home/python/Motion/Motor.html",
    "https://api.vex.com/iq2/home/python/Motion/Pneumatic.html",
    "https://api.vex.com/iq2/home/python/SDCard.html",
    "https://api.vex.com/iq2/home/python/Screen.html",
    "https://api.vex.com/iq2/home/python/Sensing/index.html",
    "https://api.vex.com/iq2/home/python/Sensing/Brain.html",
    "https://api.vex.com/iq2/home/python/Sensing/Bumper.html",
    "https://api.vex.com/iq2/home/python/Sensing/ColorSensor.html",
    "https://api.vex.com/iq2/home/python/Sensing/Distance.html",
    "https://api.vex.com/iq2/home/python/Sensing/Gyro.html",
    "https://api.vex.com/iq2/home/python/Sensing/Optical.html",
    "https://api.vex.com/iq2/home/python/Sensing/TouchLED.html",
    "https://api.vex.com/iq2/home/python/Sound.html",
    "https://api.vex.com/iq2/home/python/Vision/index.html",
    "https://api.vex.com/iq2/home/python/Vision/AI_Vision_Sensor.html",
    "https://api.vex.com/iq2/home/python/Vision/Vision_Sensor.html",
]

# Create output folder
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def extract_api_content(sb):
    """Extract relevant API content: descriptions, function signatures, parameters, and code examples."""
    content_parts = []
    seen_code = set()  # Deduplicate code snippets

    # Try to get the page title
    try:
        title = sb.get_text("h1")
        if title:
            content_parts.append(f"# {title.strip()}")
    except:
        pass

    # Get all content in order from the main content area
    try:
        # Find the main content container
        main_container = None
        for selector in ["main", "article", ".content", "#content", ".documentation", "body"]:
            try:
                elements = sb.find_elements("css selector", selector)
                if elements:
                    main_container = elements[0]
                    break
            except:
                continue

        if main_container:
            # Get all relevant child elements in document order
            # This preserves the natural flow of text -> code -> text -> code
            all_elements = main_container.find_elements("css selector",
                "h2, h3, h4, p, pre, table, ul, ol, dl, .parameter, .returns")

            for elem in all_elements:
                try:
                    tag_name = elem.tag_name.lower()
                    text = elem.text.strip()

                    if not text or len(text) < 3:
                        continue

                    # Skip navigation/menu text
                    if any(skip in text.lower() for skip in ["copy", "toggle", "menu", "navigation", "search"]):
                        continue

                    # Headers
                    if tag_name in ["h2", "h3", "h4"]:
                        content_parts.append(f"\n## {text}")

                    # Code blocks - deduplicate
                    elif tag_name == "pre":
                        # Normalize code for deduplication (remove "Copy" button text)
                        clean_code = text.replace(" Copy", "").replace("Copy", "").strip()
                        # Create a hash key from first 100 chars to detect duplicates
                        code_key = clean_code[:100]
                        if code_key not in seen_code and len(clean_code) > 5:
                            seen_code.add(code_key)
                            content_parts.append(f"```python\n{clean_code}\n```")

                    # Tables (parameter tables, return types, etc.)
                    elif tag_name == "table":
                        content_parts.append(text)

                    # Lists (often contain parameter info)
                    elif tag_name in ["ul", "ol", "dl"]:
                        content_parts.append(text)

                    # Paragraphs - the descriptive text
                    elif tag_name == "p":
                        # Skip very short or duplicate text
                        if len(text) > 20 and text not in content_parts:
                            content_parts.append(text)

                    # Parameter descriptions
                    elif "parameter" in elem.get_attribute("class").lower() if elem.get_attribute("class") else False:
                        content_parts.append(f"Parameter: {text}")

                    elif "return" in elem.get_attribute("class").lower() if elem.get_attribute("class") else False:
                        content_parts.append(f"Returns: {text}")

                except Exception:
                    continue

    except Exception as e:
        # Fallback: just get main text content
        try:
            main_content = sb.get_text("main") or sb.get_text("article") or sb.get_text("body")
            if main_content:
                content_parts.append(main_content[:3000])
        except:
            pass

    return "\n\n".join(content_parts) if content_parts else ""

def scrape_vex_api():
    # uc=True is the key: it enables "Undetected" mode to bypass Cloudflare
    with SB(uc=True, test=True) as sb:
        print(f"--- Opening first page to pass Cloudflare ---")
        sb.open(TARGET_URLS[0])

        # WAIT for Cloudflare Turnstile (the "verify human" check)
        print("Waiting for Cloudflare check...")
        sb.sleep(6)

        print(f"\nScraping {len(TARGET_URLS)} predefined API pages...")

        # Setup output file
        output_file = os.path.join(OUTPUT_DIR, "full_vex_api.txt")

        # Write header to file
        with open(output_file, "w", encoding="utf-8") as f:
            f.write("VEX IQ 2nd Gen Python API Reference\n")
            f.write("=" * 60 + "\n")
            f.write("Source: https://api.vex.com/iq2/home/python/\n")
            f.write("Contains: Function signatures, parameters, and code examples\n")
            f.write("=" * 60 + "\n\n")

        # Scrape each URL in the predefined list
        for i, url in enumerate(TARGET_URLS):
            try:
                print(f"Scraping [{i+1}/{len(TARGET_URLS)}]: {url}")
                sb.open(url)
                sb.sleep(1.5)

                # Extract only relevant API content (code, functions, parameters)
                api_content = extract_api_content(sb)

                if api_content.strip():
                    # Get a clean page name from URL
                    page_name = url.split("/")[-1].replace(".html", "")
                    if page_name == "index":
                        # Use parent folder name for index pages
                        parts = url.split("/")
                        page_name = parts[-2] if len(parts) > 1 else "index"

                    # Write immediately to file (append mode)
                    with open(output_file, "a", encoding="utf-8") as f:
                        f.write(f"\n\n{'='*60}\n")
                        f.write(f"API: {page_name}\n")
                        f.write(f"URL: {url}\n")
                        f.write(f"{'='*60}\n\n")
                        f.write(api_content)
                        f.flush()  # Force write to disk

                    print(f"  -> Written to file")

            except Exception as e:
                print(f"Failed to scrape {url}: {e}")

        print(f"\n--- Success! ---")
        print(f"Saved API content to: {output_file}")
        print(f"Total pages scraped: {len(TARGET_URLS)}")

if __name__ == "__main__":
    scrape_vex_api()