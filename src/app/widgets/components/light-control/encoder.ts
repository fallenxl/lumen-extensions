function binaryToHexadecimal(binaryStr: string): string {
    // Asegurarse de que la cadena binaria tenga un tamaño múltiplo de 4
    while (binaryStr.length % 4 !== 0) {
        binaryStr = '0' + binaryStr;
    }

    // Convertir la cadena binaria a un número entero
    const decimalValue = parseInt(binaryStr, 2);
    
    // Convertir el número entero a una cadena hexadecimal
    const hexValue = decimalValue.toString(16).toUpperCase().length===1 ? '0'+decimalValue.toString(16).toUpperCase() : decimalValue.toString(16).toUpperCase();
    return `08FF${hexValue}`;
}

function switchesToBinary(switches: number[]): string {
    // Convierte una lista de estados de los switches en una cadena binaria
    return switches.map(switchState => switchState.toString()).join('');
}

function hexToBase64(hex) {
    // Paso 1: Convertir hexadecimal a bytes
    const bytes = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    // Paso 2: Convertir bytes a base64
    let binary = '';
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary);
}

// Ejemplo de uso
// Supongamos que los switches están en el siguiente estado: [0, 0, 0, 0, 0, 0, 0, 1]
const switches: number[] = [0, 0, 0, 0, 1, 0, 0, 0];
const binaryStr = switchesToBinary(switches);
const hexValue = binaryToHexadecimal(binaryStr);


export function sendCommand(appName: string, deviceId: string, switches: number[]):Promise<any> {
    let temp  =[...switches];
    const binaryStr = switchesToBinary(temp.reverse());
    const hexStr = binaryToHexadecimal(binaryStr);
    const base64Str = hexToBase64(hexStr);
    return fetch(`https://lumen-network.nam1.cloud.thethings.industries/api/v3/as/applications/${appName}/devices/${deviceId}/down/push`, {
        method: "POST",
        headers: {
            Authorization: `Bearer NNSXS.6URDBHGP6GEKGWXX4YAVOCXLEFJFX5UEHNYD6RA.MCXAJZAHRC6SOFAAUTIM3FKDIJ7I354PHYTDOAUHUM37QPNUABXA`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            downlinks:
                [
                    {
                        "frm_payload": base64Str,
                        "confirmed": false,
                        "f_port": 1
                    }
                ]
        })
    }).then((response) => {

        return response.json();
    }).then((data) => {
        console.log(data);
    });
}