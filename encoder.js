function encodeRechargeCommand(address, rechargeCount, balance, emergencyConsumption = 0) {
    const hex = (value, length) => value.toString(16).padStart(length * 2, '0').toUpperCase();

    const leadByte = 'FEFE';
    const start = '68';
    const type = '10';
    const controlCode = '31';
    const dataId = '13A0';
    const ser = '00';
    const end = '16';

    const addressBytes = address.padStart(14, '0'); // Ajusta a 7 bytes (14 dígitos hexadecimales)
    const rechargeCountHex = hex(rechargeCount, 4);
    const balanceHex = hex(balance, 4);
    const emergencyConsumptionHex = hex(emergencyConsumption, 4);
    
    const dataLength = 15; // Longitud fija según el documento

    // Concatenar todos los campos
    const commandWithoutChecksum = [
        leadByte, start, type, addressBytes, controlCode, hex(dataLength, 1),
        dataId, ser, rechargeCountHex, balanceHex, emergencyConsumptionHex
    ].join('');

    // Calcular Checksum (suma de todos los bytes, limitado a un byte)
    const checksum = hex(
        commandWithoutChecksum.match(/../g)
            .reduce((sum, byte) => sum + parseInt(byte, 16), 0) & 0xFF,
        1
    );

    const encodedCommand = commandWithoutChecksum + checksum + end;
    return encodedCommand;
}

// Ejemplo de uso
const address = 'AAAAAAAAAAAAAA';
const rechargeCount = 1;
const balance = 12345678.00; // Balance en formato decimal
const emergencyConsumption = 0;

console.log(encodeRechargeCommand(address, rechargeCount, balance, emergencyConsumption));
