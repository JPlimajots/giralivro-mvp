import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Utilitário para converter ISBN-13 (prefixo 978) em ISBN-10 (ASIN Amazon)
 */
function convertIsbn13To10(isbn13: string): string {
  const clean = isbn13.replace(/[-\s]/g, '');
  if (clean.length === 10) return clean;
  if (clean.length === 13 && clean.startsWith('978')) {
    const core = clean.substring(3, 12);
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(core[i], 10) * (10 - i);
    }
    const remainder = 11 - (sum % 11);
    let checkDigit = remainder.toString();
    if (remainder === 10) checkDigit = 'X';
    else if (remainder === 11) checkDigit = '0';
    return core + checkDigit;
  }
  return clean;
}

/**
 * Decodifica entidades HTML básicas (ex: &quot;, &nbsp;, &#39;)
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers para Expo Go e navegadores
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-API-Key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido. Use GET.' });
  }

  const rawIsbn = (req.query.isbn as string) || '';
  const cleanIsbn = rawIsbn.replace(/[-\s]/g, '').trim();

  if (!cleanIsbn) {
    return res.status(400).json({ error: 'Parâmetro isbn é obrigatório.' });
  }

  const asin = convertIsbn13To10(cleanIsbn);
  const amazonUrl = `https://www.amazon.com.br/dp/${asin}`;

  const headers: Record<string, string> = {
    'DNT': '1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'device-memory': '16',
    'downlink': '10',
    'dpr': '1.25',
    'ect': '4g',
    'rtt': '100',
    'sec-ch-device-memory': '16',
    'sec-ch-dpr': '1.25',
    'sec-ch-ua': '"Chromium";v="124", "Microsoft Edge";v="124", "Not-A.Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-ch-viewport-width': '1280',
    'viewport-width': '1280',
  };

  try {
    const response = await fetch(amazonUrl, {
      method: 'GET',
      headers,
    });

    const html = await response.text();

    // 1. Extração do Título da Obra
    let title = '';
    const titleMatch = html.match(/<span\s+id="productTitle"[^>]*>([\s\S]*?)<\/span>/i);
    if (titleMatch) {
      title = decodeHtmlEntities(titleMatch[1]).trim();
    }

    let priceDisplay = '';
    let amount: number | null = null;
    let detectionSource = '';

    // 2. Prioridade 1: Bloco JSON data-components (Frequent Bought Together / BuyBox novo item 1)
    const dataComponentsMatch = html.match(/data-components="([^"]+)"/i);
    if (dataComponentsMatch) {
      try {
        const decodedJson = decodeHtmlEntities(dataComponentsMatch[1]);
        const components = JSON.parse(decodedJson);
        const item1 = components['1'];
        if (item1 && item1.price) {
          const whole = item1.price.wholeValue || '0';
          const fraction = item1.price.fractionalValue || '00';
          amount = parseFloat(`${whole}.${fraction}`);
          priceDisplay = item1.price.displayString || `R$ ${whole},${fraction}`;
          priceDisplay = priceDisplay.replace(/\u00a0/g, ' ').trim();
          detectionSource = 'amazon_data_components';
        }
      } catch (e) {
        // Ignora erro de JSON e vai para o fallback
      }
    }

    // 3. Prioridade 2: Bloco BuyBox Direto (#corePriceDisplay_desktop_feature_div / .priceToPay)
    if (!amount) {
      const corePriceMatch = html.match(
        /(?:id="corePriceDisplay_desktop_feature_div"|class="[^"]*priceToPay[^"]*")[\s\S]*?<span class="a-offscreen">R\$\s*([\d.,]+)<\/span>/i
      );
      if (corePriceMatch) {
        const numStr = corePriceMatch[1].replace(/\./g, '').replace(',', '.');
        amount = parseFloat(numStr);
        priceDisplay = `R$ ${corePriceMatch[1]}`;
        detectionSource = 'amazon_core_price';
      }
    }

    // 4. Prioridade 3: Formato Capa Comum / Livro Físico (#tmm-grid-swatch-PAPERBACK)
    if (!amount) {
      const paperbackMatch = html.match(
        /id="tmm-grid-swatch-PAPERBACK"[\s\S]*?R\$\s*([\d.,]+)/i
      );
      if (paperbackMatch) {
        const numStr = paperbackMatch[1].replace(/\./g, '').replace(',', '.');
        amount = parseFloat(numStr);
        priceDisplay = `R$ ${paperbackMatch[1]}`;
        detectionSource = 'amazon_paperback_swatch';
      }
    }

    // 5. Prioridade 4: Qualquer tag genérica a-offscreen contendo R$
    if (!amount) {
      const genericPriceMatch = html.match(/<span class="a-offscreen">R\$\s*([\d.,]+)<\/span>/i);
      if (genericPriceMatch) {
        const numStr = genericPriceMatch[1].replace(/\./g, '').replace(',', '.');
        amount = parseFloat(numStr);
        priceDisplay = `R$ ${genericPriceMatch[1]}`;
        detectionSource = 'amazon_offscreen_fallback';
      }
    }

    if (amount) {
      return res.status(200).json({
        success: true,
        isbn: cleanIsbn,
        asin,
        title: title || 'Livro Físico',
        amazon_price: amount,
        price_display: priceDisplay,
        currency: 'BRL',
        amazon_url: amazonUrl,
        source: detectionSource,
        fetched_at: new Date().toISOString(),
      });
    }

    return res.status(404).json({
      success: false,
      isbn: cleanIsbn,
      asin,
      message: 'Livro encontrado, mas o preço físico novo na Amazon não pôde ser determinado ou está indisponível.',
      amazon_url: amazonUrl,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao consultar Amazon.',
      details: err?.message || String(err),
      amazon_url: amazonUrl,
    });
  }
}
