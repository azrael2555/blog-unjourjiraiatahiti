import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

async function main() {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      property: 'Statut',
      select: { equals: 'Prêt à publier' }
    }
  });

  const dir = 'src/content/blog';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  for (const page of response.results) {
    const props = page.properties;
    const titre = props.Titre.title[0]?.plain_text || '';
    const slug = props.Slug.rich_text[0]?.plain_text || '';
    const description = props.Description.rich_text[0]?.plain_text || '';
    const date = props['Date de publication'].date?.start || new Date().toISOString().split('T')[0];
    const image = props.Image.url || '';
    const contenu = props.Contenu.rich_text[0]?.plain_text || '';

    if (!slug) continue;

    const markdown = `---
title: "${titre}"
description: "${description}"
date: ${date}
${image ? `image: "${image}"` : ''}
---

${contenu}
`;

    fs.writeFileSync(path.join(dir, `${slug}.md`), markdown);
    console.log(`✅ Article créé : ${slug}.md`);

    await notion.pages.update({
      page_id: page.id,
      properties: {
        Statut: { select: { name: 'Publié' } }
      }
    });
  }
}

main().catch(console.error);
