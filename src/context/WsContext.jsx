import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const WsContext  = createContext(null);
const WS_URL     = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
const RECONNECT  = 3000;

export const WsProvider = ({ children }) => {
  const { user }  = useAuth();
  const wsRef     = useRef(null);
  const timerRef  = useRef(null);
  const [connected, setConnected] = useState(false);
  const [patch,     setPatch]     = useState(null);

  const connect = useCallback(() => {
    if (!user) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen  = () => { setConnected(true); clearTimeout(timerRef.current); };
    ws.onclose = () => { setConnected(false); timerRef.current = setTimeout(connect, RECONNECT); };
    ws.onerror = () => ws.close();
    ws.onmessage = ({ data }) => {
      try {
        const msg = JSON.parse(data);
        switch (msg.type) {
          case 'DEVICE_STATUS_CHANGED': setPatch({ type:'REFETCH' }); break;
          case 'DEVICE_ONLINE':  setPatch({ type:'UNIT_PATCH', unitId:msg.unitId, update:{ isOnline:true } }); break;
          case 'STATE_UPDATED':  setPatch({ type:'UNIT_PATCH', unitId:msg.unitId, update:{ desiredState:msg.payload } }); break;
          case 'SENSOR_UPDATE':  setPatch({ type:'UNIT_PATCH', unitId:msg.unitId, update:{ sensorData:{ roomTemperature:msg.payload.roomTemperature, roomHumidity:msg.payload.roomHumidity } } }); break;
          default: break;
        }
      } catch {}
    };
  }, [user]);

  useEffect(() => {
    connect();
    return () => { clearTimeout(timerRef.current); wsRef.current?.close(); };
  }, [connect]);

  return (
    <WsContext.Provider value={{ connected, patch, clearPatch: () => setPatch(null) }}>
      {children}
    </WsContext.Provider>
  );
};

export const useWs = () => useContext(WsContext);
