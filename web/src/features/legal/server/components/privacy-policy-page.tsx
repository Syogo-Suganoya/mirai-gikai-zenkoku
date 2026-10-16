import { Container } from "@/components/layouts/container";
import {
  LegalList,
  LegalPageLayout,
  LegalParagraph,
  LegalSectionTitle,
} from "@/components/layouts/legal-page-layout";
import { EXTERNAL_LINKS } from "@/config/external-links";
import { SITE_NAME } from "@/config/site";

/**
 * プライバシーポリシー。本家（チームみらい）のポリシーを参考に、このサイトが実際に取得・利用している情報に合わせて書いている。
 * 取得する情報や外部サービス（アクセス解析・AI の記録サービスなど）を増やしたら、ここも直して最終更新日を変える。
 */
export function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      className="bg-transparent pt-24 md:pt-12"
      title="プライバシーポリシー"
      enLabel="Privacy Policy"
      description={`${SITE_NAME}（以下「本サイト」といいます）の運営者（個人。以下「運営者」といいます）が、利用者の情報をどのように取り扱うかを説明します。本サイトは政党チームみらいが運営しているものではなく、チームみらいのプライバシーポリシーは適用されません。`}
    >
      <Container className="space-y-8">
        <p className="text-sm text-mirai-text-muted">
          最終更新日：2026年10月16日
        </p>

        <section className="space-y-4">
          <LegalSectionTitle>1. 取得する情報</LegalSectionTitle>
          <LegalParagraph>
            本サイトでは、会員登録やログインはありません。氏名・住所・電話番号・メールアドレスなどを入力していただくことはありません。運営者が取得する情報は次のとおりです。
          </LegalParagraph>
          <LegalList
            items={[
              "匿名の利用者 ID：初めてアクセスしたときに端末ごとに作るランダムな ID です。運営者の署名を付けて Cookie に保存します。氏名などとは結び付けません",
              "表示の設定：説明の詳しさ・ふりがなの表示などの設定を Cookie などに保存します",
              "AI チャットの利用量：AI に送った文字数（トークン数）と費用を、匿名の利用者 ID と結び付けて記録します。質問や回答の内容は、本サイトのデータベースには保存しません",
              "AI インタビューの内容：AI との対話の記録、AI がまとめた回答の要約、公開するかどうかの選択、インタビューの評価・感想",
              "回答へのリアクション：公開された回答に付けたリアクション",
              "アクセスの記録：本サイトを置いているサービス（Vercel）が、IP アドレス・ブラウザの種類・閲覧したページなどを記録します。また、表示の速さを測るため、個人を特定しない計測（Vercel Speed Insights）を行っています",
            ]}
          />
          <LegalParagraph>
            AI
            チャットやインタビューでは、氏名・連絡先などの個人情報や、他人に知られたくない情報を書かないでください。書かれた場合も、上記と同じように取り扱います。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>2. 利用目的</LegalSectionTitle>
          <LegalList
            items={[
              "本サイトの提供（AI チャットへの回答、インタビューの続きの再開、表示の設定の保持など）",
              "AI の利用量の上限の管理と、不正な利用の防止",
              "インタビューの回答を、本人が公開を許可した範囲で本サイトに掲載し、AI でトピックにまとめて表示すること",
              "本サイトの改善（不具合の調査、利用状況の把握）",
            ]}
          />
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>
            3. AI インタビューの回答の取り扱い
          </LegalSectionTitle>
          <LegalList
            items={[
              "公開：インタビューの最後に公開を許可した回答だけを、要約と原文で匿名のまま本サイトに掲載します。誰でも読むことができます。公開を許可しなかった回答は掲載しません",
              "公開の取りやめ：公開を許可した回答も、あとから非公開に変えられます。運営者が掲載にふさわしくないと判断した回答は、掲載しないことがあります",
              "トピックの分析：公開を許可した回答を AI で分析し、議案ごとの主な意見としてまとめて表示します",
              "議員などへの共有：将来、集まった意見を、チームみらいの議員などに見せることがあります。その場合も、公開を許可した回答に限ります",
            ]}
          />
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>4. 外部のサービスの利用</LegalSectionTitle>
          <LegalParagraph>
            本サイトは、次のサービスを使って動いています。これらのサービスは日本国外の事業者が提供しており、情報は日本国外のサーバーで処理・保存されることがあります。
          </LegalParagraph>
          <LegalList
            items={[
              "Google Gemini API（Google LLC）：AI チャットの回答、インタビューの対話・要約、トピックの分析のために、入力された内容を送ります。有料プランで利用しており、Google の利用規約により、送った内容が Google の AI の学習に使われることはありません",
              "Vercel（Vercel Inc.）：本サイトの配信と、アクセスの記録・表示の速さの計測",
              "Neon（Databricks, Inc.）：データベース（インタビューの内容などの保存先）",
            ]}
          />
          <LegalParagraph>
            このほか、法令に基づく場合、人の生命・身体・財産を守るために必要な場合などを除き、取得した情報を第三者に提供することはありません。個人を特定できない形に加工した統計（回答の件数など）は、公開することがあります。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>5. Cookie について</LegalSectionTitle>
          <LegalParagraph>
            本サイトは、匿名の利用者 ID と表示の設定を保存するために Cookie
            を使います。広告やアクセス解析のための Cookie
            は使っていません。ブラウザの設定で Cookie を無効にすると、AI
            チャットやインタビューなどが使えなくなることがあります。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>6. 保存する期間</LegalSectionTitle>
          <LegalParagraph>
            AI
            インタビューの内容は、期限を決めずに保存します。そのほかの情報は、本サイトの運営に必要な間だけ保存し、必要がなくなったものは消します。なお、公開された回答を第三者が複製・保存したものは、運営者が消すことはできません。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>7. 安全管理</LegalSectionTitle>
          <LegalParagraph>
            取得した情報は、アクセスできる人を運営者に限り、通信の暗号化などの対策をしたうえで管理します。本サイトのソースコードは公開しており、情報の取り扱いを誰でも確かめることができます。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>8. 改訂</LegalSectionTitle>
          <LegalParagraph>
            このポリシーは、必要に応じて改訂します。改訂したときは、このページに掲載した時点から効力を生じます。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>9. お問い合わせ</LegalSectionTitle>
          <LegalParagraph>
            このポリシーや、インタビューの回答の公開の取りやめ・削除についてのご相談は、
            <a
              href={EXTERNAL_LINKS.REPORT}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-accent underline"
            >
              GitHub の Issue
            </a>
            で受け付けています。Issue
            は誰でも読めるため、回答の内容や個人を特定できる情報は書かずに、ご相談の内容だけをお書きください。
          </LegalParagraph>
        </section>
      </Container>
    </LegalPageLayout>
  );
}
