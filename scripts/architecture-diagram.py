# みらい議会＠全国地方議会 の構成図を生成するスクリプト。
# 必要なもの: pip install diagrams、Graphviz（brew install graphviz）
# 実行: python3 scripts/architecture-diagram.py
# 出力: docs/architecture.png

from diagrams import Cluster, Diagram, Edge
from diagrams.gcp.ml import AIPlatform
from diagrams.onprem.ci import GithubActions
from diagrams.onprem.client import User, Users
from diagrams.onprem.database import Postgresql
from diagrams.programming.framework import Nextjs
from diagrams.saas.cdn import Cloudflare

FONT = "Hiragino Sans"

graph_attr = {
    "fontname": FONT,
    "fontsize": "20",
    "bgcolor": "white",
    "pad": "0.5",
    "nodesep": "0.9",
    "ranksep": "1.6",
    "splines": "spline",
}
node_attr = {"fontname": FONT, "fontsize": "12"}
edge_attr = {"fontname": FONT, "fontsize": "11", "color": "#555555"}
cluster_attr = {"fontname": FONT, "fontsize": "14", "margin": "18"}

with Diagram(
    "みらい議会＠全国地方議会 — 構成（Next.js 15 / React 19 / Drizzle / Vercel AI SDK）",
    filename="docs/architecture",
    outformat="png",
    show=False,
    direction="LR",
    graph_attr=graph_attr,
    node_attr=node_attr,
    edge_attr=edge_attr,
):
    residents = Users("住民\nブラウザ")
    operators = User("運営者\nブラウザ")

    with Cluster("Vercel（プロジェクト2つ）", graph_attr=cluster_attr):
        web = Nextjs("公開サイト web/\n議会選択・議案・AIチャット")
        admin = Nextjs("管理画面 admin/\n議案・会期・CSV 取り込み・議会設定")

    with Cluster("データ・AI", graph_attr=cluster_attr):
        db = Postgresql("Neon\nPostgreSQL 17")
        files = Cloudflare("Cloudflare R2\nサムネイル・取り込んだ CSV")
        gemini = AIPlatform("Google Gemini API")

    actions = GithubActions(
        "GitHub Actions\nCI: lint・テスト・ビルド\nCD: マイグレーション → デプロイ"
    )

    residents >> web
    operators >> admin

    web >> Edge(label="Drizzle") >> db
    admin >> Edge(label="Drizzle") >> db
    admin >> Edge(label="アップロード") >> files
    web >> Edge(label="AIチャット") >> gemini
    admin >> Edge(label="分析") >> gemini

    actions >> Edge(style="dashed", label="マイグレーション") >> db
    actions >> Edge(style="dashed", label="Deploy Hook") >> web
    actions >> Edge(style="dashed") >> admin
