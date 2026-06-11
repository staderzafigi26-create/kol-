import csv
import json
import re
from datetime import datetime
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path("/Users/ryan/Downloads")
AFFILIATE_FILES = sorted(DOWNLOADS.glob("affiliates-01-Jun-2026-07-Jun-2026*.csv"))
ORDER_FILES = sorted(
    {
        *DOWNLOADS.glob("orders-30-May-2026-05-Jun-2026*.csv"),
        *DOWNLOADS.glob("orders-31-May-2026-07-Jun-2026.csv"),
    }
)
MARKETING_FILE = DOWNLOADS / "Yozma-红人营销总表 (3).xlsx"
OUTPUT_FILE = ROOT / "data/local/affiliate_sales.json"
REPORT_FILE = ROOT / "data/reports/affiliate-email-match-20260607.csv"
ORDER_REPORT_FILE = ROOT / "data/reports/affiliate-order-summary-20260607.csv"


EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)


def clean(value):
    if value is None:
        return ""
    if isinstance(value, float) and pd.isna(value):
        return ""
    return str(value).strip()


def emails_from(value):
    return sorted({m.group(0).lower() for m in EMAIL_RE.finditer(clean(value))})


def first_email(value):
    values = emails_from(value)
    return values[0] if values else ""


def infer_market(row):
    link = clean(row.get("Referral Link")).lower()
    country = clean(row.get("Country")).upper()
    if "ca.yozmasport" in link:
        return "CA"
    if "uk.yozmasport" in link:
        return "UK"
    if "eu.yozmasport" in link:
        return "EU"
    if country in {"US", "USA", "UNITED STATES"}:
        return "US"
    if country in {"CA", "CANADA"}:
        return "CA"
    if country in {"UK", "GB", "UNITED KINGDOM"}:
        return "UK"
    if country:
        return country
    return "US"


def to_float(value):
    text = clean(value).replace(",", "")
    if not text:
        return 0.0
    try:
        return float(text)
    except ValueError:
        return 0.0


def add_money(target, currency, amount):
    currency = clean(currency).upper() or "UNKNOWN"
    target[currency] = round(target.get(currency, 0.0) + float(amount or 0), 4)


def read_affiliates():
    rows = []
    seen = set()
    for file_path in AFFILIATE_FILES:
        with file_path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                email = clean(row.get("Email Address")).lower()
                referral_code = clean(row.get("Referral Code")).upper()
                referral_link = clean(row.get("Referral Link"))
                key = (email, referral_code, referral_link)
                if key in seen:
                    continue
                seen.add(key)
                rows.append(
                    {
                        "sourceFile": file_path.name,
                        "affiliateId": clean(row.get("ID")),
                        "affiliateName": clean(row.get("Name")),
                        "email": email,
                        "referralCode": referral_code,
                        "couponCode": clean(row.get("Coupon Code")).upper(),
                        "referralLink": referral_link,
                        "market": infer_market(row),
                        "state": clean(row.get("State")),
                        "country": clean(row.get("Country")),
                        "instagram": clean(row.get("Instagram")),
                        "youtube": clean(row.get("Youtube") or row.get("YouTube")),
                        "tiktok": clean(row.get("TikTok")),
                        "website": clean(row.get("Website")),
                        "status": clean(row.get("Status")),
                        "lastActive": clean(row.get("Last active")),
                        "dateCreated": clean(row.get("Date Created")),
                        "dateApproved": clean(row.get("Date Approved")),
                        "paymentMethod": clean(row.get("Payment Method")),
                        "hasOrderMetrics": False,
                        "orders": None,
                        "revenue": None,
                        "commission": None,
                    }
                )
    return rows


def read_orders():
    orders = []
    seen = set()
    for file_path in ORDER_FILES:
        with file_path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                order_id = clean(row.get("Order ID")) or clean(row.get("Order Number"))
                if not order_id:
                    continue
                if order_id in seen:
                    continue
                seen.add(order_id)
                status = clean(row.get("Order Status")).lower()
                orders.append(
                    {
                        "sourceFile": file_path.name,
                        "orderDate": clean(row.get("Order Date")),
                        "orderNumber": clean(row.get("Order Number")),
                        "orderId": order_id,
                        "affiliateId": clean(row.get("Affiliate ID")),
                        "affiliateName": clean(row.get("Affiliate Name")),
                        "affiliateEmail": clean(row.get("Affiliate Email")).lower(),
                        "customerEmail": clean(row.get("Customer Email")).lower(),
                        "orderTotal": to_float(row.get("Order Total")),
                        "orderSubtotal": to_float(row.get("Order Subtotal")),
                        "affiliateCommission": to_float(row.get("Affiliate Commission")),
                        "currency": clean(row.get("Currency")).upper(),
                        "discountCodes": clean(row.get("Discount codes")),
                        "orderStatus": status or "unknown",
                        "conversionSource": clean(row.get("Conversion Source")),
                        "affiliateSource": clean(row.get("Affiliate Source")),
                        "isAfterGoogleAdClick": clean(row.get("Is after Google ad click ?")),
                    }
                )
    return orders


def aggregate_orders(orders):
    by_email = {}
    by_id = {}
    for order in orders:
        email = order["affiliateEmail"]
        affiliate_id = order["affiliateId"]
        for key, bucket_map in ((email, by_email), (affiliate_id, by_id)):
            if not key:
                continue
            bucket = bucket_map.setdefault(
                key,
                {
                    "orders": 0,
                    "approvedOrders": 0,
                    "revenue": 0.0,
                    "subtotal": 0.0,
                    "commission": 0.0,
                    "revenueByCurrency": {},
                    "commissionByCurrency": {},
                    "statusBreakdown": {},
                    "orderIds": [],
                    "orderNumbers": [],
                    "firstOrderDate": "",
                    "lastOrderDate": "",
                    "latestDiscountCodes": "",
                    "conversionSources": {},
                    "affiliateSources": {},
                },
            )
            bucket["orders"] += 1
            bucket["statusBreakdown"][order["orderStatus"]] = bucket["statusBreakdown"].get(order["orderStatus"], 0) + 1
            bucket["orderIds"].append(order["orderId"])
            bucket["orderNumbers"].append(order["orderNumber"])
            if order["conversionSource"]:
                bucket["conversionSources"][order["conversionSource"]] = bucket["conversionSources"].get(order["conversionSource"], 0) + 1
            if order["affiliateSource"]:
                bucket["affiliateSources"][order["affiliateSource"]] = bucket["affiliateSources"].get(order["affiliateSource"], 0) + 1
            if order["discountCodes"]:
                bucket["latestDiscountCodes"] = order["discountCodes"]
            date = order["orderDate"]
            if date and (not bucket["firstOrderDate"] or date < bucket["firstOrderDate"]):
                bucket["firstOrderDate"] = date
            if date and (not bucket["lastOrderDate"] or date > bucket["lastOrderDate"]):
                bucket["lastOrderDate"] = date
            if order["orderStatus"] == "approved":
                bucket["approvedOrders"] += 1
                bucket["revenue"] = round(bucket["revenue"] + order["orderTotal"], 4)
                bucket["subtotal"] = round(bucket["subtotal"] + order["orderSubtotal"], 4)
                bucket["commission"] = round(bucket["commission"] + order["affiliateCommission"], 4)
                add_money(bucket["revenueByCurrency"], order["currency"], order["orderTotal"])
                add_money(bucket["commissionByCurrency"], order["currency"], order["affiliateCommission"])
    return by_email, by_id


def read_marketing_email_index():
    if not MARKETING_FILE.exists():
        return {}
    df = pd.read_excel(MARKETING_FILE, sheet_name="合作名单")
    index = {}
    for _, row in df.iterrows():
        contact = clean(row.get("联系方式"))
        emails = emails_from(contact)
        if not emails:
            continue
        item = {
            "creatorName": clean(row.get("名字")),
            "creatorCode": clean(row.get("红人编码")),
            "owner": clean(row.get("负责人")),
            "region": clean(row.get("红人编码")).split("-")[0] if clean(row.get("红人编码")) else "",
            "tier": clean(row.get("量级")),
            "followers": clean(row.get("粉丝")),
            "platformType": clean(row.get("类型")),
            "contactEmail": emails[0],
            "contactRaw": contact,
            "affiliateCodeInMarketing": clean(row.get("联盟Code")),
            "cooperationDate": clean(row.get("合作日期")),
            "cooperationProgress": clean(row.get("合作进度")),
            "firstPostUrl": clean(row.get("首个上线链接")),
            "firstPostDate": clean(row.get("上线日期")),
            "settled": clean(row.get("是否结款")),
        }
        for email in emails:
            index.setdefault(email, []).append(item)
    return index


def main():
    affiliates = read_affiliates()
    orders = read_orders()
    orders_by_email, orders_by_id = aggregate_orders(orders)
    marketing_by_email = read_marketing_email_index()
    output_rows = []
    matched = 0
    consumed_order_metric_keys = set()
    for affiliate in affiliates:
        matches = marketing_by_email.get(affiliate["email"], []) if affiliate["email"] else []
        if matches:
            matched += 1
        primary = matches[0] if matches else {}
        metric_key = None
        order_metrics = {}
        if affiliate["affiliateId"] and affiliate["affiliateId"] in orders_by_id:
            metric_key = ("id", affiliate["affiliateId"])
            order_metrics = orders_by_id.get(affiliate["affiliateId"], {})
        elif affiliate["email"] and affiliate["email"] in orders_by_email:
            metric_key = ("email", affiliate["email"])
            order_metrics = orders_by_email.get(affiliate["email"], {})
        if metric_key in consumed_order_metric_keys:
            order_metrics = {}
        elif metric_key:
            consumed_order_metric_keys.add(metric_key)
        output_rows.append(
            {
                **affiliate,
                "matchStatus": "email_matched" if matches else "unmatched",
                "matchCount": len(matches),
                "creatorName": primary.get("creatorName", ""),
                "creatorCode": primary.get("creatorCode", ""),
                "owner": primary.get("owner", ""),
                "region": primary.get("region", "") or affiliate["market"],
                "tier": primary.get("tier", ""),
                "followers": primary.get("followers", ""),
                "platformType": primary.get("platformType", ""),
                "marketingAffiliateCode": primary.get("affiliateCodeInMarketing", ""),
                "cooperationDate": primary.get("cooperationDate", ""),
                "cooperationProgress": primary.get("cooperationProgress", ""),
                "firstPostUrl": primary.get("firstPostUrl", ""),
                "firstPostDate": primary.get("firstPostDate", ""),
                "settled": primary.get("settled", ""),
                "matchedCreators": matches[:5],
                "hasOrderMetrics": bool(order_metrics),
                "orders": order_metrics.get("approvedOrders", 0) if order_metrics else 0,
                "rawOrders": order_metrics.get("orders", 0) if order_metrics else 0,
                "revenue": order_metrics.get("revenue", 0) if order_metrics else 0,
                "subtotal": order_metrics.get("subtotal", 0) if order_metrics else 0,
                "commission": order_metrics.get("commission", 0) if order_metrics else 0,
                "revenueByCurrency": order_metrics.get("revenueByCurrency", {}) if order_metrics else {},
                "commissionByCurrency": order_metrics.get("commissionByCurrency", {}) if order_metrics else {},
                "statusBreakdown": order_metrics.get("statusBreakdown", {}) if order_metrics else {},
                "orderIds": order_metrics.get("orderIds", [])[:50] if order_metrics else [],
                "orderNumbers": order_metrics.get("orderNumbers", [])[:50] if order_metrics else [],
                "firstOrderDate": order_metrics.get("firstOrderDate", "") if order_metrics else "",
                "lastOrderDate": order_metrics.get("lastOrderDate", "") if order_metrics else "",
                "latestDiscountCodes": order_metrics.get("latestDiscountCodes", "") if order_metrics else "",
                "conversionSources": order_metrics.get("conversionSources", {}) if order_metrics else {},
                "affiliateSources": order_metrics.get("affiliateSources", {}) if order_metrics else {},
                "metricsNotice": "已按订单报表匹配出单指标。" if order_metrics else "当前联盟账号在订单报表中暂无出单，或同一 Affiliate ID 的订单已在另一条区域记录计入。",
                "importedAt": datetime.now().isoformat(timespec="seconds"),
            }
        )

    existing_affiliate_ids = {row["affiliateId"] for row in affiliates if row["affiliateId"]}
    existing_emails = {row["email"] for row in affiliates if row["email"]}
    synthetic_seen = set()
    for order in orders:
        affiliate_id = order["affiliateId"]
        email = order["affiliateEmail"]
        metric_key = ("id", affiliate_id) if affiliate_id in orders_by_id else ("email", email)
        if metric_key in consumed_order_metric_keys:
            continue
        if (affiliate_id or email) in synthetic_seen:
            continue
        synthetic_seen.add(affiliate_id or email)
        order_metrics = orders_by_id.get(affiliate_id) or orders_by_email.get(email) or {}
        if not order_metrics:
            continue
        consumed_order_metric_keys.add(metric_key)
        existing_affiliate_ids.add(affiliate_id)
        existing_emails.add(email)
        matches = marketing_by_email.get(email, []) if email else []
        primary = matches[0] if matches else {}
        output_rows.append(
            {
                "sourceFile": order["sourceFile"],
                "affiliateId": affiliate_id,
                "affiliateName": order["affiliateName"],
                "email": email,
                "referralCode": clean(order["discountCodes"]).split(",")[0].strip().upper(),
                "couponCode": clean(order["discountCodes"]).split(",")[0].strip().upper(),
                "referralLink": "",
                "market": order["currency"],
                "state": "",
                "country": "",
                "instagram": "",
                "youtube": "",
                "tiktok": "",
                "website": "",
                "status": "order_only",
                "lastActive": order["lastOrderDate"] if "lastOrderDate" in order else order["orderDate"],
                "dateCreated": "",
                "dateApproved": "",
                "paymentMethod": "",
                "matchStatus": "email_matched" if matches else "order_only_unmatched",
                "matchCount": len(matches),
                "creatorName": primary.get("creatorName", ""),
                "creatorCode": primary.get("creatorCode", ""),
                "owner": primary.get("owner", ""),
                "region": primary.get("region", "") or order["currency"],
                "tier": primary.get("tier", ""),
                "followers": primary.get("followers", ""),
                "platformType": primary.get("platformType", ""),
                "marketingAffiliateCode": primary.get("affiliateCodeInMarketing", ""),
                "cooperationDate": primary.get("cooperationDate", ""),
                "cooperationProgress": primary.get("cooperationProgress", ""),
                "firstPostUrl": primary.get("firstPostUrl", ""),
                "firstPostDate": primary.get("firstPostDate", ""),
                "settled": primary.get("settled", ""),
                "matchedCreators": matches[:5],
                "hasOrderMetrics": True,
                "orders": order_metrics.get("approvedOrders", 0),
                "rawOrders": order_metrics.get("orders", 0),
                "revenue": order_metrics.get("revenue", 0),
                "subtotal": order_metrics.get("subtotal", 0),
                "commission": order_metrics.get("commission", 0),
                "revenueByCurrency": order_metrics.get("revenueByCurrency", {}),
                "commissionByCurrency": order_metrics.get("commissionByCurrency", {}),
                "statusBreakdown": order_metrics.get("statusBreakdown", {}),
                "orderIds": order_metrics.get("orderIds", [])[:50],
                "orderNumbers": order_metrics.get("orderNumbers", [])[:50],
                "firstOrderDate": order_metrics.get("firstOrderDate", ""),
                "lastOrderDate": order_metrics.get("lastOrderDate", ""),
                "latestDiscountCodes": order_metrics.get("latestDiscountCodes", ""),
                "conversionSources": order_metrics.get("conversionSources", {}),
                "affiliateSources": order_metrics.get("affiliateSources", {}),
                "metricsNotice": "订单报表中存在，但 affiliate 账号清单未找到对应记录。",
                "importedAt": datetime.now().isoformat(timespec="seconds"),
            }
        )

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(output_rows, ensure_ascii=False, indent=2), encoding="utf-8")

    REPORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with REPORT_FILE.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "affiliateName",
                "email",
                "referralCode",
                "market",
                "matchStatus",
                "creatorName",
                "creatorCode",
                "owner",
                "region",
                "cooperationProgress",
                "orders",
                "revenueByCurrency",
                "commissionByCurrency",
                "firstOrderDate",
                "lastOrderDate",
            ],
        )
        writer.writeheader()
        for row in output_rows:
            writer.writerow({key: row.get(key, "") for key in writer.fieldnames})

    print(
        json.dumps(
            {
                "affiliateFiles": len(AFFILIATE_FILES),
                "orderFiles": len(ORDER_FILES),
                "affiliateRows": len(output_rows),
                "emailMatchedRows": matched,
                "unmatchedRows": len([row for row in output_rows if row.get("matchStatus") != "email_matched"]),
                "dedupedOrders": len(orders),
                "rowsWithOrders": len([row for row in output_rows if row.get("hasOrderMetrics")]),
                "approvedOrders": sum(int(row.get("orders") or 0) for row in output_rows),
                "output": str(OUTPUT_FILE),
                "report": str(REPORT_FILE),
                "orderReport": str(ORDER_REPORT_FILE),
            },
            ensure_ascii=False,
            indent=2,
        )
    )

    with ORDER_REPORT_FILE.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "creatorName",
                "affiliateName",
                "email",
                "affiliateId",
                "referralCode",
                "owner",
                "region",
                "orders",
                "revenueByCurrency",
                "commissionByCurrency",
                "firstOrderDate",
                "lastOrderDate",
                "matchStatus",
            ],
        )
        writer.writeheader()
        for row in sorted(output_rows, key=lambda item: int(item.get("orders") or 0), reverse=True):
            writer.writerow({key: json.dumps(row.get(key, ""), ensure_ascii=False) if isinstance(row.get(key), (dict, list)) else row.get(key, "") for key in writer.fieldnames})


if __name__ == "__main__":
    main()
