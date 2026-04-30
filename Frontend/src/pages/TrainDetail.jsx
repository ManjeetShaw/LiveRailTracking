import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrainDetail, getTrainInstances } from '../services/api';
import { io } from 'socket.io-client';

export default function TrainDetail() {
  const { trainNumber }         = useParams();
  const navigate                = useNavigate();
  const [train, setTrain]       = useState(null);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [liveData, setLiveData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trainRes, instanceRes] = await Promise.all([
          getTrainDetail(trainNumber),
          getTrainInstances(trainNumber)
        ]);
        setTrain(trainRes.data.data.train);
        setInstances(instanceRes.data.data.instances || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [trainNumber]);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    instances.forEach(inst => {
      socket.emit('subscribe-train', inst._id);
      socket.on('position-update', (data) => {
        if (data.trainInstanceId === inst._id) {
          setLiveData(prev => ({ ...prev, [inst._id]: data }));
        }
      });
    });
    return () => socket.disconnect();
  }, [instances]);

  if (loading) return <div style={styles.loading}>Loading train details...</div>;
  if (!train)  return <div style={styles.loading}>Train not found.</div>;

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <span style={styles.navLogo}>🚂 EkkWomm</span>
        <button style={styles.backBtn} onClick={() => navigate('/')}>← Back</button>
      </div>

      {/* Train Header */}
      <div style={styles.hero}>
        <h1 style={styles.trainNum}>{train.trainNumber}</h1>
        <h2 style={styles.trainName}>{train.trainName}</h2>
        <span style={styles.trainType}>{train.trainType}</span>
        <div style={styles.route}>{train.originStation} → {train.destinationStation}</div>
      </div>

      {/* Analytics */}
      <div style={styles.analytics}>
        <div style={styles.stat}>
          <span style={styles.statVal}>{train.analytics?.avgDelayMinutes || 0} min</span>
          <span style={styles.statLabel}>Avg Delay</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statVal}>{train.analytics?.onTimePercentage || 0}%</span>
          <span style={styles.statLabel}>On Time</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statVal}>{train.analytics?.totalCompletedRuns || 0}</span>
          <span style={styles.statLabel}>Total Runs</span>
        </div>
      </div>

      {/* Live Instances */}
      <div style={styles.content}>
        <h3 style={styles.sectionTitle}>Live Running Instances</h3>
        {instances.length === 0 && <p style={styles.msg}>No active instances right now.</p>}
        {instances.map(inst => {
          const live = liveData[inst._id];
          const pos  = live || inst.currentPosition;
          return (
            <div key={inst._id} style={styles.card}>
              <div style={styles.cardTop}>
                <span style={styles.date}>Date: {inst.originDepartureDate?.slice(0, 10)}</span>
                <span style={inst.status === 'running' ? styles.running : styles.arrived}>
                  {inst.status === 'running' ? '🟢 Running' : '✅ Arrived'}
                </span>
              </div>
              {pos && (
                <>
                  <div style={styles.progress}>
                    <div style={{ ...styles.progressBar, width: `${pos.progressPercent || 0}%` }} />
                  </div>
                  <div style={styles.stations}>
                    <span>Last: {pos.lastStation?.name || '-'}</span>
                    <span>{pos.progressPercent || 0}%</span>
                    <span>Next: {pos.nextStation?.name || '-'}</span>
                  </div>
                  <div style={styles.delayRow}>
                    <span style={styles.delayBadge}>
                      Delay: {live?.delayMinutes ?? inst.delayMinutes ?? 0} min
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Schedule */}
        {train.schedule?.length > 0 && (
          <>
            <h3 style={styles.sectionTitle}>Schedule</h3>
            <div style={styles.scheduleTable}>
              <div style={styles.scheduleHeader}>
                <span>Station</span>
                <span>Arrival</span>
                <span>Departure</span>
                <span>Day</span>
              </div>
              {train.schedule.map((s, i) => (
                <div key={i} style={styles.scheduleRow}>
                  <span>{s.stationName} ({s.stationCode})</span>
                  <span>{s.arrivalTime || '--'}</span>
                  <span>{s.departureTime || '--'}</span>
                  <span>Day {s.day}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container:     { minHeight: '100vh', background: '#f5f5f5' },
  loading:       { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#1a237e' },
  navbar:        { background: '#1a237e', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navLogo:       { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  backBtn:       { background: 'transparent', border: '1px solid #fff', color: '#fff', padding: '6px 14px', borderRadius: 6, cursor: 'pointer' },
  hero:          { background: '#1a237e', padding: '40px 24px', textAlign: 'center' },
  trainNum:      { color: '#ff6f00', fontSize: 36, margin: '0 0 8px' },
  trainName:     { color: '#fff', fontSize: 24, margin: '0 0 8px', fontWeight: 'normal' },
  trainType:     { background: '#ff6f00', color: '#fff', padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 'bold' },
  route:         { color: '#90caf9', fontSize: 16, marginTop: 12 },
  analytics:     { display: 'flex', justifyContent: 'center', gap: 32, background: '#fff', padding: '20px 24px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' },
  stat:          { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  statVal:       { fontSize: 24, fontWeight: 'bold', color: '#1a237e' },
  statLabel:     { fontSize: 12, color: '#999', textTransform: 'uppercase' },
  content:       { maxWidth: 800, margin: '32px auto', padding: '0 16px' },
  sectionTitle:  { fontSize: 18, fontWeight: 'bold', color: '#1a237e', marginBottom: 16 },
  card:          { background: '#fff', borderRadius: 10, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  cardTop:       { display: 'flex', justifyContent: 'space-between', marginBottom: 12 },
  date:          { fontSize: 14, color: '#666' },
  running:       { color: '#43a047', fontWeight: 'bold', fontSize: 14 },
  arrived:       { color: '#1a237e', fontWeight: 'bold', fontSize: 14 },
  progress:      { height: 10, background: '#e0e0e0', borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  progressBar:   { height: '100%', background: '#ff6f00', borderRadius: 5, transition: 'width 1s ease' },
  stations:      { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666', marginBottom: 8 },
  delayRow:      { display: 'flex', justifyContent: 'flex-end' },
  delayBadge:    { background: '#fff3e0', color: '#ff6f00', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 'bold' },
  scheduleTable: { background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  scheduleHeader:{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 16px', background: '#1a237e', color: '#fff', fontSize: 13, fontWeight: 'bold' },
  scheduleRow:   { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 16px', borderBottom: '1px solid #eee', fontSize: 14, color: '#333' },
  msg:           { textAlign: 'center', color: '#666', fontSize: 16 },
};