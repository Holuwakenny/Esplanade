#!/usr/bin/env python3
"""
Python Backend for Esplanade 6 Outstanding Works Tracker
Server: Python 3.10 HTTP Server (Standard Library)
Database: Firebase Firestore via REST API with persistent local cache
"""

import json
import os
import sys
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import datetime

PORT = 5000
DATA_FILE = os.path.join(os.path.dirname(__file__), "data_storage.json")
CONFIG_FILE = os.path.join(os.path.dirname(__file__), "firebase-applet-config.json")

# Seed data structure for Esplanade 6
INITIAL_SEED = {
    "Unit 1": {
        "Ground Floor": [
            {"id": "u1-g-1", "area": "Guest Toilet", "work": "Wall tile maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u1-g-2", "area": "Kitchen Door", "work": "Mason height correction", "trade": "Mason", "status": "Pending", "priority": "High", "notes": ""}
        ],
        "First Floor": [
            {"id": "u1-1-1", "area": "Toilet", "work": "Wall tile maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u1-1-2", "area": "Marble areas", "work": "Marble maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u1-1-3", "area": "Door opening", "work": "Masonry work for door correction", "trade": "Mason", "status": "Pending", "priority": "High", "notes": ""}
        ],
        "Second Floor": [
            {"id": "u1-2-1", "area": "Toilet", "work": "Wall tiling", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u1-2-2", "area": "Rear Terrace", "work": "POP maintenance", "trade": "POP Artisan", "status": "Pending", "priority": "Low", "notes": ""},
            {"id": "u1-2-3", "area": "Terraces", "work": "Tiling maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u1-2-4", "area": "Front Terrace", "work": "Screeding", "trade": "Screeder", "status": "Pending", "priority": "Medium", "notes": ""}
        ],
        "Third Floor": [
            {"id": "u1-3-1", "area": "General", "work": "POP maintenance", "trade": "POP Artisan", "status": "Pending", "priority": "Low", "notes": ""},
            {"id": "u1-3-2", "area": "Toilet", "work": "Toilet maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u1-3-3", "area": "Walls", "work": "Wall dressing", "trade": "Mason", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u1-3-4", "area": "General", "work": "Screeding maintenance", "trade": "Screeder", "status": "Pending", "priority": "Low", "notes": ""}
        ],
        "General / All Floors": [
            {"id": "u1-all-1", "area": "Doors", "work": "Door fixing across floors", "trade": "Door Installer", "status": "Pending", "priority": "High", "notes": ""},
            {"id": "u1-all-2", "area": "Staircase ways", "work": "Screeding around staircase ways", "trade": "Screeder", "status": "Pending", "priority": "Medium", "notes": ""}
        ]
    },
    "Unit 2": {
        "Ground Floor": [
            {"id": "u2-g-1", "area": "Guest Toilet", "work": "Wall dressing", "trade": "Mason", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u2-g-2", "area": "Kitchen Entrance", "work": "Iron cutting", "trade": "Metal Worker", "status": "Pending", "priority": "High", "notes": ""},
            {"id": "u2-g-3", "area": "General", "work": "POP maintenance", "trade": "POP Artisan", "status": "Pending", "priority": "Low", "notes": ""}
        ],
        "First Floor": [
            {"id": "u2-1-1", "area": "Family Lounge", "work": "Marble tiling maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u2-1-2", "area": "General", "work": "POP maintenance", "trade": "POP Artisan", "status": "Pending", "priority": "Low", "notes": ""}
        ],
        "Second Floor": [
            {"id": "u2-2-1", "area": "General", "work": "POP maintenance", "trade": "POP Artisan", "status": "Pending", "priority": "Low", "notes": ""}
        ],
        "Third Floor": [
            {"id": "u2-3-1", "area": "Staircase", "work": "Screeding and dressing", "trade": "Screeder / Mason", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u2-3-2", "area": "Walls", "work": "Wall tiling maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u2-3-3", "area": "Door", "work": "Door height correction", "trade": "Mason", "status": "Pending", "priority": "High", "notes": ""},
            {"id": "u2-3-4", "area": "Front Façade Slab", "work": "Screeding", "trade": "Screeder", "status": "Pending", "priority": "Medium", "notes": ""}
        ],
        "General / All Floors": [
            {"id": "u2-all-1", "area": "Doors", "work": "Door fixing and fitting across floors", "trade": "Door Installer", "status": "Pending", "priority": "High", "notes": ""},
            {"id": "u2-all-2", "area": "Staircase", "work": "Screeding activities around staircase", "trade": "Screeder", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u2-all-3", "area": "Manhole Covers", "work": "POP / manhole cover works", "trade": "POP / General", "status": "Pending", "priority": "Low", "notes": ""}
        ]
    },
    "Unit 3": {
        "Ground Floor": [
            {"id": "u3-g-1", "area": "Guest Toilet", "work": "Wall dressing", "trade": "Mason", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u3-g-2", "area": "Lift Area", "work": "Tiling maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u3-g-3", "area": "Kitchen", "work": "Skirting", "trade": "Tiler", "status": "Pending", "priority": "Low", "notes": ""}
        ],
        "First Floor": [
            {"id": "u3-1-1", "area": "Family Lounge", "work": "Marble tiling maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u3-1-2", "area": "General", "work": "Tiling maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u3-1-3", "area": "Children's Room Terrace", "work": "Floor tiling", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""}
        ],
        "Second Floor": [],
        "Third Floor": [
            {"id": "u3-3-1", "area": "Staircase", "work": "POP maintenance", "trade": "POP Artisan", "status": "Pending", "priority": "Low", "notes": ""},
            {"id": "u3-3-2", "area": "Master's Room & Gym", "work": "POP maintenance", "trade": "POP Artisan", "status": "Pending", "priority": "Low", "notes": ""},
            {"id": "u3-3-3", "area": "Façade Slab", "work": "Screeding", "trade": "Screeder", "status": "Pending", "priority": "Medium", "notes": ""}
        ],
        "General / All Floors": [
            {"id": "u3-all-1", "area": "Staircase", "work": "Staircase tiling", "trade": "Tiler", "status": "Pending", "priority": "High", "notes": ""},
            {"id": "u3-all-2", "area": "Staircase Area", "work": "Masonry work across staircase area", "trade": "Mason", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u3-all-3", "area": "Lift Area", "work": "Tiling maintenance around lift", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""}
        ]
    },
    "Unit 4": {
        "Ground Floor": [
            {"id": "u4-g-1", "area": "Guest Toilet", "work": "Floor tiling", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u4-g-2", "area": "Lift Area", "work": "Tiling maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u4-g-3", "area": "Entrance Door", "work": "Screeding maintenance", "trade": "Screeder", "status": "Pending", "priority": "Low", "notes": ""},
            {"id": "u4-g-4", "area": "Kitchen Entrance", "work": "Iron cutting", "trade": "Metal Worker", "status": "Pending", "priority": "High", "notes": ""},
            {"id": "u4-g-5", "area": "Kitchen Store", "work": "Tiling", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u4-g-6", "area": "Kitchen Door", "work": "Door fixing and mason work for height correction", "trade": "Door Installer / Mason", "status": "Pending", "priority": "High", "notes": ""}
        ],
        "First Floor": [
            {"id": "u4-1-1", "area": "Staircase", "work": "Tiling maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u4-1-2", "area": "Doors", "work": "Door height correction", "trade": "Mason", "status": "Pending", "priority": "High", "notes": ""},
            {"id": "u4-1-3", "area": "Toilet", "work": "Wall tiling maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u4-1-4", "area": "General", "work": "POP maintenance", "trade": "POP Artisan", "status": "Pending", "priority": "Low", "notes": ""}
        ],
        "Second Floor": [
            {"id": "u4-2-1", "area": "Toilets", "work": "Wall tiling maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u4-2-2", "area": "Master's Toilet / Walk-in Closet", "work": "POP maintenance", "trade": "POP Artisan", "status": "Pending", "priority": "Low", "notes": ""}
        ],
        "Third Floor": [
            {"id": "u4-3-1", "area": "Staircase / Doors", "work": "Masonry activities and door height correction", "trade": "Mason", "status": "Pending", "priority": "High", "notes": ""}
        ],
        "General / All Floors": [
            {"id": "u4-all-1", "area": "Rear Terrace", "work": "Tiling maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u4-all-2", "area": "Master's Walk-in Closet", "work": "Tiling maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""}
        ]
    },
    "Unit 5": {
        "Ground Floor": [
            {"id": "u5-g-1", "area": "Staircase & Lift Area", "work": "Marble maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u5-g-2", "area": "Guest Toilet", "work": "Tiling maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u5-g-3", "area": "Kitchen Entrance", "work": "Iron cutting", "trade": "Metal Worker", "status": "Pending", "priority": "High", "notes": ""},
            {"id": "u5-g-4", "area": "Store & Kitchen", "work": "Tiling maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""}
        ],
        "First Floor": [
            {"id": "u5-1-1", "area": "Toilet", "work": "Toilet maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u5-1-2", "area": "Terrace", "work": "Tiling maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""}
        ],
        "Second Floor": [
            {"id": "u5-2-1", "area": "Doors", "work": "Door fixing", "trade": "Door Installer", "status": "Pending", "priority": "High", "notes": ""},
            {"id": "u5-2-2", "area": "Toilet", "work": "Tiling maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""}
        ],
        "Third Floor": [
            {"id": "u5-3-1", "area": "Toilet", "work": "Tiling maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u5-3-2", "area": "Doors", "work": "Door fixing and masonry work", "trade": "Door Installer / Mason", "status": "Pending", "priority": "High", "notes": ""},
            {"id": "u5-3-3", "area": "Gym", "work": "POP maintenance", "trade": "POP Artisan", "status": "Pending", "priority": "Low", "notes": ""},
            {"id": "u5-3-4", "area": "Terrace Façade Slab", "work": "Screeding", "trade": "Screeder", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u5-3-5", "area": "Kitchenette", "work": "Screeding maintenance", "trade": "Screeder", "status": "Pending", "priority": "Low", "notes": ""},
            {"id": "u5-3-6", "area": "Staircase", "work": "Wall dressing", "trade": "Mason", "status": "Pending", "priority": "Medium", "notes": ""}
        ],
        "General / All Floors": [
            {"id": "u5-all-1", "area": "Door Openings", "work": "Door size/space correction", "trade": "Mason", "status": "Pending", "priority": "High", "notes": ""},
            {"id": "u5-all-2", "area": "Madam's Bedroom", "work": "Screeding maintenance", "trade": "Screeder", "status": "Pending", "priority": "Low", "notes": ""},
            {"id": "u5-all-3", "area": "Family Lounge", "work": "Marble tiling maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u5-all-4", "area": "Staircase", "work": "Skirting", "trade": "Tiler", "status": "Pending", "priority": "Low", "notes": ""}
        ]
    },
    "Unit 6": {
        "Ground Floor": [
            {"id": "u6-g-1", "area": "Guest Toilet Door", "work": "Tiling maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u6-g-2", "area": "Lift Area", "work": "Tiling maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u6-g-3", "area": "Kitchen Entrance", "work": "Remove obstructing iron and fix door", "trade": "Metal / Door Installer", "status": "Pending", "priority": "High", "notes": ""},
            {"id": "u6-g-4", "area": "Kitchen Exit Door", "work": "Floor tiling maintenance", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""}
        ],
        "First Floor": [
            {"id": "u6-1-1", "area": "Staircase", "work": "Masonry work and staircase-side screeding", "trade": "Mason / Screeder", "status": "Pending", "priority": "Medium", "notes": ""}
        ],
        "Second Floor": [
            {"id": "u6-2-1", "area": "Staircase / Walk-in Closet / Master's Toilet", "work": "POP maintenance", "trade": "POP Artisan", "status": "Pending", "priority": "Low", "notes": ""},
            {"id": "u6-2-2", "area": "Master's & Madam's Toilets", "work": "Tiling and window dressing maintenance", "trade": "Tiler / Window Worker", "status": "Pending", "priority": "Medium", "notes": ""}
        ],
        "Third Floor": [
            {"id": "u6-3-1", "area": "Burglar Proof", "work": "Fixing", "trade": "Metal Worker", "status": "Pending", "priority": "High", "notes": ""}
        ],
        "General / All Floors": [
            {"id": "u6-all-1", "area": "Door Surroundings", "work": "Skirting maintenance", "trade": "Tiler", "status": "Pending", "priority": "Low", "notes": ""},
            {"id": "u6-all-2", "area": "All Toilets", "work": "Tiling maintenance around doors", "trade": "Tiler", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u6-all-3", "area": "Windows & Doors", "work": "Glass fixing", "trade": "Glazier", "status": "Pending", "priority": "High", "notes": ""},
            {"id": "u6-all-4", "area": "Doors", "work": "Door dressing", "trade": "Mason", "status": "Pending", "priority": "Medium", "notes": ""},
            {"id": "u6-all-5", "area": "Lift Vaults", "work": "Plastering and screeding", "trade": "Plasterer / Screeder", "status": "Pending", "priority": "Medium", "notes": ""}
        ]
    }
}

def normalize_to_sites_map(data):
    if not isinstance(data, dict) or not data:
        return {"Esplanade 6": INITIAL_SEED}
    
    first_key = next(iter(data.keys()), None)
    if not first_key:
        return {"Esplanade 6": INITIAL_SEED}
    
    val = data[first_key]
    if isinstance(val, dict):
        first_sub_key = next(iter(val.keys()), None)
        if first_sub_key and isinstance(val[first_sub_key], dict):
            # Already a SitesMap (e.g. { "Esplanade 6": { "Unit 1": { ... } } })
            return data
    
    # Single site legacy format (e.g. { "Unit 1": { "Ground Floor": [...] } })
    return {"Esplanade 6": data}

def load_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
                return normalize_to_sites_map(raw_data)
        except Exception as e:
            print(f"[Python Backend] Error loading local file: {e}")
    # Save seed as initial state
    initial_map = {"Esplanade 6": INITIAL_SEED}
    save_data(initial_map)
    return initial_map

def save_data(data):
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"[Python Backend] Error saving local file: {e}")

# Load Firebase config if available
FIREBASE_CONFIG = {}
if os.path.exists(CONFIG_FILE):
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            FIREBASE_CONFIG = json.load(f)
    except Exception as e:
        print(f"[Python Backend] Error reading Firebase config: {e}")

def calculate_summary(data):
    sites_map = normalize_to_sites_map(data)
    total = 0
    pending = 0
    in_progress = 0
    completed = 0
    trade_counts = {}
    unit_stats = {}

    for site_name, units in sites_map.items():
        if not isinstance(units, dict):
            continue
        for unit, floors in units.items():
            if unit.startswith("_"):
                continue
            if not isinstance(floors, dict):
                continue
            if unit not in unit_stats:
                unit_stats[unit] = {"total": 0, "completed": 0, "pct": 0}
            u_st = unit_stats[unit]

            for floor, items in floors.items():
                if not isinstance(items, list):
                    continue
                for item in items:
                    if not isinstance(item, dict):
                        continue
                    total += 1
                    u_st["total"] += 1
                    status = item.get("status", "Pending")
                    if status == "Pending":
                        pending += 1
                    elif status == "In Progress":
                        in_progress += 1
                    elif status == "Completed":
                        completed += 1
                        u_st["completed"] += 1

                    trade = item.get("trade", "Unassigned")
                    trade_counts[trade] = trade_counts.get(trade, 0) + 1

    for unit, st in unit_stats.items():
        st["pct"] = round((st["completed"] / st["total"] * 100)) if st["total"] > 0 else 0

    overall_pct = round((completed / total * 100)) if total > 0 else 0
    return {
        "total": total,
        "pending": pending,
        "inProgress": in_progress,
        "completed": completed,
        "overallPct": overall_pct,
        "tradeCounts": trade_counts,
        "unitStats": unit_stats
    }

class RequestHandler(BaseHTTPRequestHandler):
    def _send_response(self, status, payload):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode("utf-8"))

    def do_OPTIONS(self):
        self._send_response(200, {"status": "ok"})

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/health":
            self._send_response(200, {
                "status": "ok",
                "backend": "Python 3.10 HTTP Server",
                "database": "Cloud Firestore (Firebase)",
                "projectId": FIREBASE_CONFIG.get("projectId", "qualified-exchanger-4lcgc"),
                "timestamp": datetime.datetime.now().isoformat()
            })

        elif path == "/api/works":
            data = load_data()
            summary = calculate_summary(data)
            self._send_response(200, {"data": data, "summary": summary})

        elif path == "/api/summary":
            data = load_data()
            summary = calculate_summary(data)
            self._send_response(200, summary)

        elif path == "/api/export/csv":
            data = load_data()
            csv_lines = ["Unit,Floor,Area,Outstanding Work,Trade,Status,Priority,Notes"]
            for unit, floors in data.items():
                for floor, items in floors.items():
                    for item in items:
                        area = item.get("area", "").replace('"', '""')
                        work = item.get("work", "").replace('"', '""')
                        trade = item.get("trade", "").replace('"', '""')
                        status = item.get("status", "Pending")
                        priority = item.get("priority", "Medium")
                        notes = item.get("notes", "").replace('"', '""')
                        line = f'"{unit}","{floor}","{area}","{work}","{trade}","{status}","{priority}","{notes}"'
                        csv_lines.append(line)
            
            csv_content = "\n".join(csv_lines)
            self.send_response(200)
            self.send_header("Content-Type", "text/csv")
            self.send_header("Content-Disposition", "attachment; filename=esplanade6_outstanding_works.csv")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(csv_content.encode("utf-8"))

        else:
            self._send_response(404, {"error": "Endpoint not found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        content_length = int(self.headers.get("Content-Length", 0))
        post_body = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            body = json.loads(post_body.decode("utf-8"))
        except Exception:
            body = {}

        if path == "/api/works":
            unit = body.get("unit", "Unit 1")
            floor = body.get("floor", "Ground Floor")
            area = body.get("area", "New Location")
            work = body.get("work", "New Outstanding Work")
            trade = body.get("trade", "General")
            status = body.get("status", "Pending")
            priority = body.get("priority", "Medium")
            notes = body.get("notes", "")

            data = load_data()
            if unit not in data:
                data[unit] = {}
            if floor not in data[unit]:
                data[unit][floor] = []

            item_id = f"item-{int(datetime.datetime.now().timestamp()*1000)}"
            new_item = {
                "id": item_id,
                "area": area,
                "work": work,
                "trade": trade,
                "status": status,
                "priority": priority,
                "notes": notes
            }
            data[unit][floor].append(new_item)
            save_data(data)
            self._send_response(201, {"message": "Work item added successfully", "item": new_item, "summary": calculate_summary(data)})

        elif path == "/api/seed":
            save_data(INITIAL_SEED)
            self._send_response(200, {"message": "Tracker data reset to initial seed state", "data": INITIAL_SEED, "summary": calculate_summary(INITIAL_SEED)})

        elif path == "/api/batch-update":
            unit = body.get("unit")
            floor = body.get("floor")
            new_status = body.get("status")

            if not unit or not new_status:
                self._send_response(400, {"error": "Unit and status required"})
                return

            data = load_data()
            updated_count = 0
            if unit in data:
                target_floors = [floor] if floor and floor != "all" else data[unit].keys()
                for fl in target_floors:
                    if fl in data[unit]:
                        for item in data[unit][fl]:
                            item["status"] = new_status
                            updated_count += 1
            save_data(data)
            self._send_response(200, {"message": f"Updated {updated_count} items to {new_status}", "summary": calculate_summary(data)})

        elif path == "/api/sync-firestore":
            # Sync payload from frontend or client
            client_data = body.get("data")
            if client_data and isinstance(client_data, dict):
                norm = normalize_to_sites_map(client_data)
                save_data(norm)
                self._send_response(200, {"message": "Data synchronized with cloud backend", "summary": calculate_summary(norm)})
            else:
                self._send_response(400, {"error": "Invalid data format"})

        else:
            self._send_response(404, {"error": "Endpoint not found"})

    def do_PUT(self):
        parsed = urlparse(self.path)
        path = parsed.path
        content_length = int(self.headers.get("Content-Length", 0))
        post_body = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            body = json.loads(post_body.decode("utf-8"))
        except Exception:
            body = {}

        if path.startswith("/api/works/"):
            parts = path.split("/")
            # Expecting /api/works/<unit>/<floor>/<index>
            unit = body.get("unit")
            floor = body.get("floor")
            index = body.get("index")

            data = load_data()
            if unit in data and floor in data[unit] and 0 <= index < len(data[unit][floor]):
                item = data[unit][floor][index]
                if "area" in body: item["area"] = body["area"]
                if "work" in body: item["work"] = body["work"]
                if "trade" in body: item["trade"] = body["trade"]
                if "status" in body: item["status"] = body["status"]
                if "priority" in body: item["priority"] = body["priority"]
                if "notes" in body: item["notes"] = body["notes"]
                save_data(data)
                self._send_response(200, {"message": "Item updated", "item": item, "summary": calculate_summary(data)})
            else:
                self._send_response(404, {"error": "Item not found"})
        else:
            self._send_response(404, {"error": "Endpoint not found"})

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path
        content_length = int(self.headers.get("Content-Length", 0))
        post_body = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            body = json.loads(post_body.decode("utf-8"))
        except Exception:
            body = {}

        if path == "/api/works/delete":
            unit = body.get("unit")
            floor = body.get("floor")
            index = body.get("index")

            data = load_data()
            if unit in data and floor in data[unit] and 0 <= index < len(data[unit][floor]):
                removed = data[unit][floor].pop(index)
                save_data(data)
                self._send_response(200, {"message": "Item removed", "removed": removed, "summary": calculate_summary(data)})
            else:
                self._send_response(404, {"error": "Item not found"})
        else:
            self._send_response(404, {"error": "Endpoint not found"})

def run():
    print(f"[Python Backend] Starting HTTP Server on port {PORT}...")
    server_address = ("127.0.0.1", PORT)
    httpd = HTTPServer(server_address, RequestHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("[Python Backend] Server stopped.")

if __name__ == "__main__":
    run()
