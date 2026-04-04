export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    // Hole die Daten aus dem KV Namespace
    const kvDataStr = await env.TEMPLATES_KV.get('current_templates');
    let kvData = null;

    if (kvDataStr) {
      kvData = JSON.parse(kvDataStr);
    } else {
      // Wenn nichts im KV ist, lade die statische templates.json als Fallback
      const originUrl = new URL(request.url);
      const staticResponse = await fetch(new URL('/templates.json', originUrl));
      if (staticResponse.ok) {
        const staticData = await staticResponse.json();
        kvData = {
          data: staticData,
          lastUpdated: Date.now()
        };
        // Initial im KV speichern
        await env.TEMPLATES_KV.put('current_templates', JSON.stringify(kvData));
      } else {
        return new Response(JSON.stringify({ error: "Fehler beim Laden des Fallbacks." }), { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }
    }

    return new Response(JSON.stringify(kvData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const payload = await request.json();
    if (!payload || !payload.data) {
      return new Response(JSON.stringify({ error: "Invalid payload format." }), { status: 400 });
    }

    const { data: newData, lastUpdated: clientLastUpdated } = payload;

    // Hole den aktuellen Stand aus dem KV, um Überschreiben zu verhindern
    const currentKvDataStr = await env.TEMPLATES_KV.get('current_templates');
    
    if (currentKvDataStr) {
      const currentKvData = JSON.parse(currentKvDataStr);
      // Wenn das Client-Update älter ist als die Server-Version: Konflikt!
      if (currentKvData.lastUpdated && clientLastUpdated && clientLastUpdated < currentKvData.lastUpdated) {
        return new Response(JSON.stringify({ 
          error: "Konflikt: Es existiert bereits eine neuere Version der Daten auf dem Server.", 
          serverData: currentKvData 
        }), { 
          status: 409, // Conflict
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Erstelle ein neues Speicher-Objekt mit aktuellem Zeitstempel
    const newTimestamp = Date.now();
    const newRecord = {
      data: newData,
      lastUpdated: newTimestamp
    };

    // Im KV speichern
    await env.TEMPLATES_KV.put('current_templates', JSON.stringify(newRecord));

    return new Response(JSON.stringify({ success: true, lastUpdated: newTimestamp }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
