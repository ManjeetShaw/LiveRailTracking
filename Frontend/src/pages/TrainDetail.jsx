import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrainDetail, getTrainInstances } from '../services/api';
import { io } from 'socket.io-client';

export default function TrainDetail() {
  const { trainNumber }           = useParams();
  const navigate                  = useNavigate();
  const [train, setTrain]         = useState(null);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [liveData, setLiveData]   = useState({});
  const [activeInst, setActiveInst] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trainRes, instanceRes] = await Promise.all([
          getTrainDetail(trainNumber),
          getTrainInstances(trainNumber)
        ]);
        const t  = trainRes.data.data.train;
        const is = instanceRes.data.data.instances || [];
        setTrain(t);
        setInstances(is);
        // Default: pick the running instance, else first
        const running = is.find(i => i.status === 'running') || is[0];
        if (running) setActiveInst(running._id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [trainNumber]);

  useEffect(() => {
    if (!instances.length) return;
    const socket = io('http://localhost:5000');
    instances.forEach(inst => {
      socket.emit('subscribe-train', inst._id);
    });
    socket.on('position-update', (data) => {
      setLiveData(prev => ({ ...prev, [data.trainInstanceId]: data }));
    });
    return () => socket.disconnect();
  }, [instances]);

  if (loading) return <div style={s.loading}>Loading train details...</div>;
  if (!train)  return <div style={s.loading}>Train not found.</div>;

  const currentInst = instances.find(i => i._id === activeInst);
  const live        = currentInst ? (liveData[currentInst._id] || currentInst) : null;
  const stops       = train.stops || [];

  // Find which stop the train is currently at based on live position
  const currentStopCode = live?.currentPosition?.lastStation?.code;
  const currentStopIdx  = stops.findIndex(s => s.stationCode === currentStopCode);

  const getStopStatus = (idx) => {
    if (currentStopIdx === -1) return 'upcoming';
    if (idx < currentStopIdx)  return 'passed';
    if (idx === currentStopIdx) return 'current';
    return 'upcoming';
  };

  const delayMin = live?.delayMinutes ?? currentInst?.delayMinutes ?? 0;

  // Add delay to a time string and return formatted time
  const addDelay = (timeStr, delay) => {
    if (!timeStr || timeStr === '--') return '--';
    const [h, m] = timeStr.split(':').map(Number);
    const total  = h * 60 + m + delay;
    const nh     = Math.floor(total / 60) % 24;
    const nm     = total % 60;
    return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
  };

  return (
    <div style={s.page}>
      {/* Navbar */}
      <div style={s.navbar}>
        <span style={s.logo}>🚂 EkkWomm</span>
        <button style={s.backBtn} onClick={() => navigate('/')}>← Back</button>
      </div>

      {/* Hero */}
      <div style={s.hero}>
        <div style={s.trainNum}>{train.trainNumber}</div>
        <div style={s.trainName}>{train.trainName}</div>
        <span style={s.typeBadge}>{train.trainType}</span>
        <div style={s.route}>{train.originStation} → {train.destinationStation}</div>
        <div style={s.meta}>
          {train.totalDistance && <span>📏 {train.totalDistance} km</span>}
          {train.totalDuration  && <span>⏱ {train.totalDuration}</span>}
          {train.departureTime  && <span>🕐 Departs {train.departureTime}</span>}
        </div>
      </div>

      {/* Analytics bar */}
      <div style={s.analytics}>
        <div style={s.stat}>
          <span style={s.statVal}>{train.analytics?.avgDelayMinutes ?? 0} min</span>
          <span style={s.statLabel}>Avg Delay</span>
        </div>
        <div style={s.divider}/>
        <div style={s.stat}>
          <span style={s.statVal}>{train.analytics?.onTimePercentage ?? 0}%</span>
          <span style={s.statLabel}>On Time</span>
        </div>
        <div style={s.divider}/>
        <div style={s.stat}>
          <span style={s.statVal}>{train.analytics?.totalCompletedRuns ?? 0}</span>
          <span style={s.statLabel}>Total Runs</span>
        </div>
      </div>

      <div style={s.body}>

        {/* Instance selector tabs */}
        {instances.length > 0 && (
          <div style={s.tabs}>
            <div style={s.tabsLabel}>Select Run:</div>
            <div style={s.tabsList}>
              {instances.map(inst => (
                <button
                  key={inst._id}
                  style={{
                    ...s.tab,
                    ...(activeInst === inst._id ? s.tabActive : {})
                  }}
                  onClick={() => setActiveInst(inst._id)}
                >
                  <span style={s.tabDate}>{inst.originDepartureDate?.slice(0, 10)}</span>
                  <span style={{
                    ...s.tabStatus,
                    color: inst.status === 'running' ? '#43a047'
                         : inst.status === 'arrived' ? '#1565c0'
                         : '#999'
                  }}>
                    {inst.status === 'running'   ? '🟢 Running'
                   : inst.status === 'arrived'   ? '✅ Arrived'
                   : inst.status === 'scheduled' ? '🕐 Scheduled'
                   : inst.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live position banner */}
        {currentInst?.status === 'running' && live?.currentPosition && (
          <div style={s.liveBanner}>
            <div style={s.liveDot}/>
            <div style={s.liveText}>
              <span style={s.livePrimary}>
                {live.currentPosition.progressPercent}% complete —&nbsp;
                Between <b>{live.currentPosition.lastStation?.name}</b> and <b>{live.currentPosition.nextStation?.name}</b>
              </span>
              <span style={{
                ...s.delayBadge,
                background: delayMin <= 15 ? '#e8f5e9' : delayMin <= 60 ? '#fff3e0' : '#fce4ec',
                color:      delayMin <= 15 ? '#2e7d32' : delayMin <= 60 ? '#e65100' : '#c62828',
              }}>
                {delayMin <= 5 ? '✅ On Time' : `⚠️ ${delayMin} min late`}
              </span>
            </div>
            {/* Progress bar */}
            <div style={s.progressTrack}>
              <div style={{ ...s.progressFill, width: `${live.currentPosition.progressPercent || 0}%` }}/>
            </div>
          </div>
        )}

        {/* Vertical Station Timeline */}
        {stops.length > 0 && (
          <div style={s.timelineCard}>
            <div style={s.timelineTitle}>🛤️ Station Timeline</div>
            <div style={s.timelineHeader}>
              <span style={s.thArr}>Arrival</span>
              <span style={s.thStn}>Station</span>
              <span style={s.thDep}>Departure</span>
            </div>

            {stops.map((stop, idx) => {
              const status     = currentInst?.status === 'running' ? getStopStatus(idx) : 'upcoming';
              const isCurrent  = status === 'current';
              const isPassed   = status === 'passed';
              const isFirst    = idx === 0;
              const isLast     = idx === stops.length - 1;

              const scheduledArr = stop.arrivalTime   || (isFirst ? '--' : '--');
              const scheduledDep = stop.departureTime || (isLast  ? '--' : '--');
              const liveArr      = (!isFirst && delayMin > 0) ? addDelay(scheduledArr, delayMin) : scheduledArr;
              const liveDep      = (!isLast  && delayMin > 0) ? addDelay(scheduledDep, delayMin) : scheduledDep;
              const showDelay    = delayMin > 0 && currentInst?.status === 'running';

              return (
                <div key={stop.stationCode} style={{
                  ...s.stopRow,
                  background: isCurrent ? '#fff8e1' : 'transparent',
                  borderLeft: isCurrent ? '3px solid #ff6f00' : '3px solid transparent',
                }}>
                  {/* Arrival time column */}
                  <div style={s.timeCol}>
                    {!isFirst && (
                      <>
                        <span style={{ ...s.timeScheduled, color: isPassed ? '#aaa' : '#333' }}>
                          {scheduledArr}
                        </span>
                        {showDelay && !isPassed && (
                          <span style={s.timeLive}>{liveArr}</span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Dot + line column */}
                  <div style={s.dotCol}>
                    {idx !== 0 && (
                      <div style={{
                        ...s.line,
                        background: isPassed || isCurrent ? '#ff6f00' : '#e0e0e0'
                      }}/>
                    )}
                    <div style={{
                      ...s.dot,
                      background:   isCurrent ? '#ff6f00' : isPassed ? '#ff6f00' : '#e0e0e0',
                      border:       isCurrent ? '3px solid #fff' : isPassed ? 'none' : '2px solid #bbb',
                      boxShadow:    isCurrent ? '0 0 0 3px #ff6f00' : 'none',
                      width:        isCurrent ? 16 : isFirst || isLast ? 14 : 10,
                      height:       isCurrent ? 16 : isFirst || isLast ? 14 : 10,
                    }}/>
                    {idx !== stops.length - 1 && (
                      <div style={{
                        ...s.line,
                        background: isPassed ? '#ff6f00' : '#e0e0e0'
                      }}/>
                    )}
                  </div>

                  {/* Station info column */}
                  <div style={s.stationCol}>
                    <span style={{
                      ...s.stationName,
                      color:      isCurrent ? '#ff6f00' : isPassed ? '#aaa' : '#1a237e',
                      fontWeight: isCurrent || isFirst || isLast ? 'bold' : 'normal',
                    }}>
                      {stop.stationName}
                    </span>
                    <span style={s.stationCode}>{stop.stationCode}</span>
                    {stop.dayOffset > 0 && (
                      <span style={s.dayBadge}>Day +{stop.dayOffset}</span>
                    )}
                    {isCurrent && (
                      <span style={s.hereTag}>◀ Train is here</span>
                    )}
                  </div>

                  {/* Departure time column */}
                  <div style={{ ...s.timeCol, textAlign: 'right' }}>
                    {!isLast && (
                      <>
                        <span style={{ ...s.timeScheduled, color: isPassed ? '#aaa' : '#333' }}>
                          {scheduledDep}
                        </span>
                        {showDelay && !isPassed && (
                          <span style={s.timeLive}>{liveDep}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Runs on days */}
        {train.runsOn?.length > 0 && (
          <div style={s.runsCard}>
            <span style={s.runsLabel}>Runs on: </span>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
              <span key={day} style={{
                ...s.dayChip,
                background: train.runsOn.includes(day) ? '#1a237e' : '#f0f0f0',
                color:      train.runsOn.includes(day) ? '#fff'     : '#aaa',
              }}>{day}</span>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

const s = {
  page:          { minHeight: '100vh', background: '#f5f7fa', fontFamily: 'sans-serif' },
  loading:       { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#1a237e' },

  navbar:        { background: '#1a237e', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo:          { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  backBtn:       { background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', color: '#fff', padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 14 },

  hero:          { background: '#1a237e', padding: '32px 24px 28px', textAlign: 'center' },
  trainNum:      { color: '#ff6f00', fontSize: 38, fontWeight: 'bold', marginBottom: 4 },
  trainName:     { color: '#fff', fontSize: 22, marginBottom: 10, fontWeight: '500' },
  typeBadge:     { background: '#ff6f00', color: '#fff', padding: '4px 16px', borderRadius: 20, fontSize: 13, fontWeight: 'bold' },
  route:         { color: '#90caf9', fontSize: 16, marginTop: 12, letterSpacing: 1 },
  meta:          { display: 'flex', gap: 20, justifyContent: 'center', marginTop: 10, color: '#b3c5e8', fontSize: 13 },

  analytics:     { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0, background: '#fff', padding: '16px 24px', boxShadow: '0 2px 6px rgba(0,0,0,0.07)' },
  stat:          { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 },
  statVal:       { fontSize: 22, fontWeight: 'bold', color: '#1a237e' },
  statLabel:     { fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 },
  divider:       { width: 1, height: 40, background: '#eee' },

  body:          { maxWidth: 700, margin: '24px auto', padding: '0 16px 40px' },

  tabs:          { background: '#fff', borderRadius: 10, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  tabsLabel:     { fontSize: 13, color: '#666', marginBottom: 10, fontWeight: '600' },
  tabsList:      { display: 'flex', gap: 10, flexWrap: 'wrap' },
  tab:           { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 16px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fafafa', cursor: 'pointer', minWidth: 120 },
  tabActive:     { border: '2px solid #1a237e', background: '#e8eaf6' },
  tabDate:       { fontSize: 13, fontWeight: 'bold', color: '#333' },
  tabStatus:     { fontSize: 12, marginTop: 2 },

  liveBanner:    { background: '#fff', borderRadius: 10, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #ffe0b2' },
  liveDot:       { width: 10, height: 10, borderRadius: '50%', background: '#43a047', display: 'inline-block', marginRight: 8, animation: 'pulse 1s infinite' },
  liveText:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 },
  livePrimary:   { fontSize: 14, color: '#333' },
  delayBadge:    { padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 'bold' },
  progressTrack: { height: 8, background: '#e0e0e0', borderRadius: 4, overflow: 'hidden', marginTop: 4 },
  progressFill:  { height: '100%', background: '#ff6f00', borderRadius: 4, transition: 'width 1s ease' },

  timelineCard:  { background: '#fff', borderRadius: 10, padding: '16px 0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16, overflow: 'hidden' },
  timelineTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a237e', padding: '0 16px 12px', borderBottom: '1px solid #f0f0f0' },
  timelineHeader:{ display: 'grid', gridTemplateColumns: '80px 1fr 80px', padding: '8px 16px', background: '#f5f7fa', fontSize: 11, color: '#999', fontWeight: 'bold', textTransform: 'uppercase' },
  thArr:         { textAlign: 'left' },
  thStn:         { textAlign: 'center' },
  thDep:         { textAlign: 'right' },

  stopRow:       { display: 'grid', gridTemplateColumns: '80px 36px 1fr 80px', alignItems: 'center', padding: '6px 0 6px 16px', transition: 'background 0.2s' },
  timeCol:       { display: 'flex', flexDirection: 'column', gap: 2 },
  timeScheduled: { fontSize: 13, fontWeight: '500' },
  timeLive:      { fontSize: 12, color: '#e65100', fontWeight: 'bold' },

  dotCol:        { display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minHeight: 48 },
  line:          { width: 2, flex: 1, minHeight: 16 },
  dot:           { borderRadius: '50%', zIndex: 1, flexShrink: 0, transition: 'all 0.3s' },

  stationCol:    { display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 8px' },
  stationName:   { fontSize: 14, transition: 'color 0.2s' },
  stationCode:   { fontSize: 11, color: '#999', letterSpacing: 1 },
  dayBadge:      { fontSize: 10, background: '#e3f2fd', color: '#1565c0', padding: '1px 6px', borderRadius: 4, width: 'fit-content' },
  hereTag:       { fontSize: 11, color: '#ff6f00', fontWeight: 'bold', marginTop: 2 },

  runsCard:      { background: '#fff', borderRadius: 10, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  runsLabel:     { fontSize: 13, color: '#666', fontWeight: '600' },
  dayChip:       { padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 'bold' },
};