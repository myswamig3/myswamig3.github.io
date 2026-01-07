export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "https://swamiginstitute.com",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS")
      return new Response(null, { headers: cors });

    if (request.method !== "POST")
      return new Response("Method Not Allowed", { status: 405, headers: cors });

    try {
      const data = await request.json();
      if (!data.email) {
        return new Response(JSON.stringify({ error: "Missing applicant email." }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" }
        });
      }

      const key = `app_${Date.now()}`;
      await env.SWAMIG_APPLICATIONS.put(key, JSON.stringify(data));

      const adminEmail = {
        personalizations: [{ to: [{ email: "app@swamiginstitute.com" }] }],
        from: { email: "noreply@swamiginstitute.com", name: "SwamiG Institute" },
        reply_to: [{ email: data.email }],
        subject: "New Obi Orisha Application Received",
        content: [
          { type: "text/plain", value:
            `New submission received at ${new Date().toLocaleString()}:\n\n` +
            JSON.stringify(data, null, 2)
          }
        ]
      };

      const applicantEmail = {
        personalizations: [{ to: [{ email: data.email }] }],
        from: { email: "noreply@swamiginstitute.com", name: "SwamiG Institute" },
        subject: "Your Obi Orisha Application Has Been Received",
        content: [
          { type: "text/plain", value:
            `E ku orire!\n\nDear ${data.name || "applicant"},\n\n` +
            `Thank you for applying for the Obi Orisha Divination Module.\n\n` +
            `Your application has been received and is being reviewed by SwamiG Institute.\n\n` +
            `If needed, we will reach out to you at ${data.email} for further details.\n\n` +
            `In light and alignment,\nSwamiG Institute`
          }
        ]
      };

      await Promise.all([
        fetch("https://api.mailchannels.net/tx/v1/send", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(adminEmail) }),
        fetch("https://api.mailchannels.net/tx/v1/send", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(applicantEmail) })
      ]);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...cors, "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }
  }
};
