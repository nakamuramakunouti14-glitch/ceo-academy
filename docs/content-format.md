# 教材の書き方

- 形の正：`src/lib/content/schema.ts`
- 整合の確かめ：`src/lib/content/verify.ts`（`npm test` で本物の教材に対して動く）
- 元にした形：`ai-engineering-academy/docs/content-format.md`。演習・コードの実行・ヒントは持ってこない

## ファイル構成

```text
content/
├─ fields.yaml                         13分野の一覧と、地図の真ん中の分野 (center)
├─ themes/<分野ID>/<番号-名前>/
│  ├─ theme.md                         frontmatter と本文
│  └─ quiz.yaml                        確認クイズ 5 問
└─ cases/<ケースID>.yaml                ケーススタディ（分野内のケースと横断ケース）
```

## 固定 ID

ID は進み具合の保存（IndexedDB）に残る。変えると記録が切れるので、作った後は変えない。

- 分野：`accounting` などの英小文字
- テーマ：`<分野ID>-<2桁の番号>`。番号は作った順で、あとから変えない。並び順は frontmatter の `order` で決める（同じ分野の中で重ねない）
- 問題：`<テーマかケースのID>/q-<名前>`。問題番号を ID に入れない
- ケース：横断は `case-cross-<2桁>`、分野内は `case-<分野ID>-<2桁>`

## theme.md

| 項目 | 必須 | 内容 |
|---|---|---|
| `id`・`field`・`order` | 必須 | 固定 ID、分野、分野の中の順番 |
| `title`・`summary`・`minutes` | 必須 | 題名、一覧に出す一言、目安の分 |
| `connections` | 必須（1つ以上） | つながり。`to` は分野かテーマの ID、`note` はその分野ではどう効くか |
| `sources`・`asOf` | 法務・税務は必須 | 出典（`title`・`url`・`checkedAt`）と、いつ時点の情報か |
| `status` | 必須 | `draft` か `reviewed`（reviewer の確認を通ったら） |

本文は `## 要点` の節を必ず置く。本文の `##` 見出しが節になり、クイズの `reviewSection` から飛べる。HTML・画像・コードは書かない。つながりの注記は本文に書かず、frontmatter の `connections` に書く（画面が「ほかの分野ではこう効く」として出し、つながりの地図の線にもなる）。

まだ書いていないテーマへのつながりは、分野の ID に向ける。テーマを書いたら、テーマの ID に向け直す。

## quiz.yaml

1 テーマ 5 問。選択問題だけ。選択肢は表示順に `a`〜`d`。正解の位置は、分野ごとに同じ位置が半数を超えないようにする。`reviewSection` は本文の `##` 見出しと同じ文字にする。YAML では、`,` や `:` を含む選択肢を `"` で囲む。

## ケース（cases/*.yaml）

| 項目 | 内容 |
|---|---|
| `kind` | `cross`（横断）か `field`（分野内） |
| `situation`・`facts`・`question`・`options` | 場面、数字の要点（4つまで）、問い、案（2〜3） |
| `perspectives` | 分野ごとの目線。横断ケースは 3 分野以上 |
| `checks` | 数字で確かめる問題（クイズと同じ形） |
| `effects` | 3 表への効果。横断ケースは必須 |
| `modelAnswer` | 模範の考え方 |
| `relatedThemes` | 土台になるテーマ |

### 増減表（effects）

単位は万円。`period` に「いつの時点の、何との差か」を書く。

- `pl`：利益への効果。費用が増えたら負の数。小計の行（`total: true`）は、それより上の小計でない行の合計にする。当期純利益の行に `netIncome: true`
- `bs`：期末の残高の増減。`side` は `asset`・`liability`・`equity`。現金の行に `cash: true`、利益剰余金の行に `retainedEarnings: true`
- `cf`：`section` は `operating`・`investing`・`financing`
- `payback`：回収期間を出すとき。年数は画面が計算する
- `assumptions`：数字の前提。簡単にしたところも書く

検証は次を確かめる。PL の小計が合う、資産の増減 ＝ 負債＋純資産の増減、BS の現金の増減 ＝ CF の合計、利益剰余金の増減 ＝ 当期純利益（配当はしない前提）。

## 書き方の注意

- 会社と数字は架空（みなと館ホテルなど）。実在の社員・顧客・会社の数字を使わない
- 本文と画面の文言は、`docs/easy-japanese.md` の決まり（です・ます、短い文、用語にはやさしい説明）で書く（2026-11-07 から）
- 「必ず」「だけ」と言い切るときは、条件がないか確かめる
- 法務・税務は、法令（e-Gov）や国税庁などの公的機関の URL と確認日、時点を書く
