export async function getMilesightTokenService(url: string, clientId: string, clientSecret: string) {
    const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
    });

    try {
        const response = await fetch(`${url}/oauth/token`, {
            method: 'POST',

            headers: { 'Content-Type': 'application/x-www-form-urlencoded'},
            body: body.toString()
        });

        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

        const data = await response.json();
        console.log(data);
        return { success: true, token: data.data.access_token, data };
    } catch (error) {
        return { success: false, error };
    }
}