import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrainDetail, getTrainInstances } from '../services/api';
import { io } from 'socket.io-client';

// ✅ Fix: use env variable instead of hardcoded localhost
const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://ekkwomm.binarybuilds.online';

export default function TrainDetail() {
  const { trainNumber }             = useParams();
  const navigate                    = useNavigate();
  const [train, setTrain]           = useState(null);
  const [instances, setInstances]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [liveData, setLiveData]     = useState({});
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
    const socket = io(SOCKET_URL); // ✅ Fixed socket URL
    instances.forEach(inst => socket.emit('subscribe-train', inst._id));
    socket.on('position-update', (data) => {
      setLiveData(prev => ({ ...prev, [data.trainInstanceId]: data }));
    });
    return () => socket.disconnect();
  }, [instances]);

  if (loading) return (
    <div className="td-loading">
      <div className="td-loading-train">🚂</div>
      <p>Loading train details...</p>
    </div>
  );
  if (!train) return (
    <div className="td-loading">
      <span>🚫</span>
      <p>Train not found.</p>
      <button className="td-back-btn" onClick={() => navigate('/')}>Go Back</button>
    </div>
  );

  const currentInst    = instances.find(i => i._id === activeInst);
  const live           = currentInst ? (liveData[currentInst._id] || currentInst) : null;
  const stops          = train.stops || [];
  const currentStopCode = live?.currentPosition?.lastStation?.code;
  const currentStopIdx  = stops.findIndex(s => s.stationCode === currentStopCode);
  const delayMin        = live?.delayMinutes ?? currentInst?.delayMinutes ?? 0;
  const progressPercent = live?.currentPosition?.progressPercent || 0;
  const isRunning       = currentInst?.status === 'running';

  const getStopStatus = (idx) => {
    if (currentStopIdx === -1) return 'upcoming';
    if (idx < currentStopIdx)  return 'passed';
    if (idx === currentStopIdx) return 'current';
    return 'upcoming';
  };

  const addDelay = (timeStr, delay) => {
    if (!timeStr || timeStr === '--') return '--';
    const [h, m] = timeStr.split(':').map(Number);
    const total  = h * 60 + m + delay;
    const nh     = Math.floor(total / 60) % 24;
    const nm     = total % 60;
    return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
  };

  const delayColor = delayMin <= 5 ? '#2e7d32' : delayMin <= 30 ? '#e65100' : '#c62828';
  const delayBg    = delayMin <= 5 ? '#e8f5e9' : delayMin <= 30 ? '#fff3e0' : '#fce4ec';
  const delayLabel = delayMin <= 5 ? '✅ On Time' : `⚠️ ${delayMin} min late`;

  const statusColor = (status) => ({
    running:   '#2e7d32',
    arrived:   '#1565c0',
    scheduled: '#757575',
  }[status] || '#757575');

  const statusLabel = (status) => ({
    running:   '🟢 Running',
    arrived:   '✅ Arrived',
    scheduled: '🕐 Scheduled',
  }[status] || status);

  return (
    <div className="td-page">

      {/* ── Navbar ── */}
      <nav className="td-nav">
        <span className="td-nav-logo" onClick={() => navigate('/')}>🚂 EkkWomm</span>
        <button className="td-nav-back" onClick={() => navigate('/')}>← Back to Search</button>
      </nav>

      {/* ── Hero ── */}
      <div className="td-hero">
        <div className="td-hero-inner">
          <div className="td-train-num">{train.trainNumber}</div>
          <div className="td-train-name">{train.trainName}</div>
          <div className="td-badges">
            <span className="td-type-badge">{train.trainType}</span>
            {isRunning && (
              <span className="td-live-badge">
                <span className="td-live-dot" /> LIVE
              </span>
            )}
          </div>
          <div className="td-route">
            <span>{train.originStation}</span>
            <span className="td-route-arrow">──🚂──▶</span>
            <span>{train.destinationStation}</span>
          </div>
          <div className="td-meta">
            {train.totalDistance && <span>📏 {train.totalDistance} km</span>}
            {train.totalDuration  && <span>⏱ {train.totalDuration}</span>}
            {train.departureTime  && <span>🕐 Departs {train.departureTime}</span>}
          </div>
        </div>
      </div>

      {/* ── Analytics Bar ── */}
      <div className="td-analytics">
        <div className="td-stat">
          <span className="td-stat-val" style={{ color: delayColor }}>
            {train.analytics?.avgDelayMinutes ?? 0} min
          </span>
          <span className="td-stat-label">Avg Delay</span>
        </div>
        <div className="td-divider" />
        <div className="td-stat">
          <span className="td-stat-val" style={{ color: '#2e7d32' }}>
            {train.analytics?.onTimePercentage ?? 0}%
          </span>
          <span className="td-stat-label">On Time</span>
        </div>
        <div className="td-divider" />
        <div className="td-stat">
          <span className="td-stat-val">{train.analytics?.totalCompletedRuns ?? 0}</span>
          <span className="td-stat-label">Total Runs</span>
        </div>
        <div className="td-divider" />
        <div className="td-stat">
          <span className="td-stat-val">{stops.length}</span>
          <span className="td-stat-label">Stations</span>
        </div>
      </div>

      <div className="td-body">

        {/* ── Instance Selector ── */}
        {instances.length > 0 && (
          <div className="td-card">
            <div className="td-card-title">📅 Select Run</div>
            <div className="td-inst-list">
              {instances.map(inst => (
                <button
                  key={inst._id}
                  className={`td-inst-btn ${activeInst === inst._id ? 'td-inst-active' : ''}`}
                  onClick={() => setActiveInst(inst._id)}
                >
                  <span className="td-inst-date">
                    {inst.originDepartureDate?.slice(0, 10)}
                  </span>
                  <span className="td-inst-status" style={{ color: statusColor(inst.status) }}>
                    {statusLabel(inst.status)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Live Position Banner ── */}
        {isRunning && live?.currentPosition && (
          <div className="td-live-banner">
            <div className="td-live-header">
              <div className="td-live-indicator">
                <span className="td-live-dot-lg" />
                <span className="td-live-title">Live Position</span>
              </div>
              <span className="td-delay-pill" style={{ background: delayBg, color: delayColor }}>
                {delayLabel}
              </span>
            </div>
            <p className="td-live-desc">
              Between <strong>{live.currentPosition.lastStation?.name}</strong> and{' '}
              <strong>{live.currentPosition.nextStation?.name}</strong>
            </p>
            <div className="td-progress-wrap">
              <span className="td-progress-label">{train.originStation}</span>
              <div className="td-progress-track">
                <div
                  className="td-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
                <div
                  className="td-progress-train"
                  style={{ left: `${progressPercent}%` }}
                >🚂</div>
              </div>
              <span className="td-progress-label">{train.destinationStation}</span>
            </div>
            <div className="td-progress-pct">{progressPercent}% of journey complete</div>
          </div>
        )}

        {/* ── Station Timeline ── */}
        {stops.length > 0 && (
          <div className="td-card td-timeline-card">
            <div className="td-card-title">🛤️ Station Timeline</div>
            <div className="td-timeline-header">
              <span>Arrival</span>
              <span>Station</span>
              <span>Departure</span>
            </div>

            {stops.map((stop, idx) => {
              const status    = isRunning ? getStopStatus(idx) : 'upcoming';
              const isCurrent = status === 'current';
              const isPassed  = status === 'passed';
              const isFirst   = idx === 0;
              const isLast    = idx === stops.length - 1;
              const showDelay = delayMin > 0 && isRunning;
              const schedArr  = stop.arrivalTime   || '--';
              const schedDep  = stop.departureTime || '--';
              const liveArr   = (!isFirst && showDelay && !isPassed) ? addDelay(schedArr, delayMin) : null;
              const liveDep   = (!isLast  && showDelay && !isPassed) ? addDelay(schedDep, delayMin) : null;

              return (
                <div
                  key={stop.stationCode}
                  className={`td-stop ${isCurrent ? 'td-stop-current' : ''} ${isPassed ? 'td-stop-passed' : ''}`}
                >
                  {/* Arrival */}
                  <div className="td-time-col">
                    {!isFirst && (
                      <>
                        <span className="td-time-sched" style={{ color: isPassed ? '#bbb' : '#333' }}>
                          {schedArr}
                        </span>
                        {liveArr && <span className="td-time-live">{liveArr}</span>}
                      </>
                    )}
                  </div>

                  {/* Dot + line */}
                  <div className="td-dot-col">
                    {idx !== 0 && (
                      <div className="td-line" style={{ background: isPassed || isCurrent ? '#ff6f00' : '#e0e0e0' }} />
                    )}
                    <div
                      className="td-dot"
                      style={{
                        background:  isCurrent ? '#ff6f00' : isPassed ? '#ff6f00' : '#ddd',
                        width:       isCurrent ? 18 : isFirst || isLast ? 14 : 10,
                        height:      isCurrent ? 18 : isFirst || isLast ? 14 : 10,
                        boxShadow:   isCurrent ? '0 0 0 4px #ff6f0033' : 'none',
                        border:      isCurrent ? '3px solid #fff' : 'none',
                      }}
                    />
                    {idx !== stops.length - 1 && (
                      <div className="td-line" style={{ background: isPassed ? '#ff6f00' : '#e0e0e0' }} />
                    )}
                  </div>

                  {/* Station info */}
                  <div className="td-stn-col">
                    <span
                      className="td-stn-name"
                      style={{
                        color:      isCurrent ? '#ff6f00' : isPassed ? '#bbb' : '#1a237e',
                        fontWeight: isCurrent || isFirst || isLast ? '700' : '400',
                      }}
                    >
                      {stop.stationName}
                    </span>
                    <span className="td-stn-code">{stop.stationCode}</span>
                    <div className="td-stn-tags">
                      {stop.dayOffset > 0 && (
                        <span className="td-day-badge">Day +{stop.dayOffset}</span>
                      )}
                      {isCurrent && (
                        <span className="td-here-tag">◀ Train is here</span>
                      )}
                    </div>
                  </div>

                  {/* Departure */}
                  <div className="td-time-col td-time-right">
                    {!isLast && (
                      <>
                        <span className="td-time-sched" style={{ color: isPassed ? '#bbb' : '#333' }}>
                          {schedDep}
                        </span>
                        {liveDep && <span className="td-time-live">{liveDep}</span>}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Runs On Days ── */}
        {train.runsOn?.length > 0 && (
          <div className="td-card td-runs-card">
            <span className="td-runs-label">Runs on:</span>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
              <span
                key={day}
                className="td-day-chip"
                style={{
                  background: train.runsOn.includes(day) ? '#1a237e' : '#f0f0f0',
                  color:      train.runsOn.includes(day) ? '#fff'     : '#bbb',
                }}
              >
                {day}
              </span>
            ))}
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .td-page { min-height: 100vh; background: #f0f2f8; font-family: 'Inter', sans-serif; }

        /* Loading */
        .td-loading {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 12px;
          color: #1a237e; font-size: 16px; font-family: 'Inter', sans-serif;
        }
        .td-loading-train { font-size: 56px; animation: chug 0.5s infinite alternate; }
        @keyframes chug { from { transform: translateX(-6px); } to { transform: translateX(6px); } }
        .td-back-btn {
          margin-top: 12px; padding: 10px 24px; background: #1a237e;
          color: #fff; border: none; border-radius: 8px; cursor: pointer;
          font-family: 'Inter', sans-serif; font-size: 14px;
        }

        /* Navbar */
        .td-nav {
          background: #0d1b5e; padding: 0 24px; height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 100;
          box-shadow: 0 2px 12px rgba(0,0,0,0.3);
        }
        .td-nav-logo { color: #fff; font-size: 20px; font-weight: 800; cursor: pointer; }
        .td-nav-back {
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
          color: #fff; padding: 7px 16px; border-radius: 8px; cursor: pointer;
          font-size: 13px; font-family: 'Inter', sans-serif; font-weight: 500;
        }
        .td-nav-back:hover { background: rgba(255,255,255,0.2); }

        /* Hero */
        .td-hero {
          background: linear-gradient(160deg, #0d1b5e 0%, #1a237e 60%, #283593 100%);
          padding: 40px 24px 36px; text-align: center; position: relative; overflow: hidden;
        }
        .td-hero::before {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 50px; background: #f0f2f8;
          clip-path: ellipse(55% 100% at 50% 100%);
        }
        .td-hero-inner { position: relative; z-index: 1; }
        .td-train-num { color: #ff6f00; font-size: 44px; font-weight: 800; letter-spacing: -1px; }
        .td-train-name { color: #fff; font-size: 20px; font-weight: 600; margin: 4px 0 12px; }
        .td-badges { display: flex; justify-content: center; gap: 8px; margin-bottom: 14px; }
        .td-type-badge {
          background: #ff6f00; color: #fff; padding: 4px 14px;
          border-radius: 20px; font-size: 12px; font-weight: 700;
        }
        .td-live-badge {
          background: #e8f5e9; color: #2e7d32; padding: 4px 14px;
          border-radius: 20px; font-size: 12px; font-weight: 700;
          display: flex; align-items: center; gap: 6px;
        }
        .td-live-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #43a047;
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        .td-route { color: #90caf9; font-size: 15px; letter-spacing: 0.5px; margin-bottom: 10px; }
        .td-route-arrow { margin: 0 10px; color: #ff6f00; }
        .td-meta { display: flex; gap: 20px; justify-content: center; color: #b3c5e8; font-size: 13px; flex-wrap: wrap; }

        /* Analytics */
        .td-analytics {
          display: flex; justify-content: center; align-items: center;
          background: #fff; padding: 16px 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.07);
        }
        .td-stat { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; }
        .td-stat-val { font-size: 22px; font-weight: 800; color: #1a237e; }
        .td-stat-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
        .td-divider { width: 1px; height: 40px; background: #eee; }

        /* Body */
        .td-body { max-width: 720px; margin: 28px auto; padding: 0 16px 48px; }

        /* Generic card */
        .td-card {
          background: #fff; border-radius: 14px; padding: 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 16px;
        }
        .td-card-title { font-size: 15px; font-weight: 700; color: #1a237e; margin-bottom: 14px; }

        /* Instance selector */
        .td-inst-list { display: flex; gap: 10px; flex-wrap: wrap; }
        .td-inst-btn {
          display: flex; flex-direction: column; align-items: center;
          padding: 10px 16px; border-radius: 10px; border: 1.5px solid #e0e0e0;
          background: #fafafa; cursor: pointer; min-width: 120px;
          font-family: 'Inter', sans-serif; transition: all 0.2s;
        }
        .td-inst-active { border-color: #1a237e; background: #e8eaf6; }
        .td-inst-date { font-size: 13px; font-weight: 700; color: #333; }
        .td-inst-status { font-size: 12px; margin-top: 3px; font-weight: 500; }

        /* Live banner */
        .td-live-banner {
          background: #fff; border-radius: 14px; padding: 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          border: 1.5px solid #ffe0b2; margin-bottom: 16px;
        }
        .td-live-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .td-live-indicator { display: flex; align-items: center; gap: 8px; }
        .td-live-dot-lg {
          width: 10px; height: 10px; border-radius: 50%; background: #43a047;
          animation: pulse 1s infinite; flex-shrink: 0;
        }
        .td-live-title { font-size: 15px; font-weight: 700; color: #1a237e; }
        .td-delay-pill { padding: 5px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; }
        .td-live-desc { font-size: 14px; color: #555; margin-bottom: 16px; }

        /* Progress bar */
        .td-progress-wrap { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
        .td-progress-label { font-size: 11px; color: #999; font-weight: 600; white-space: nowrap; flex-shrink: 0; max-width: 80px; overflow: hidden; text-overflow: ellipsis; }
        .td-progress-track { flex: 1; height: 10px; background: #e0e0e0; border-radius: 10px; position: relative; overflow: visible; }
        .td-progress-fill { height: 100%; background: linear-gradient(90deg, #ff6f00, #ffb300); border-radius: 10px; transition: width 1s ease; }
        .td-progress-train { position: absolute; top: 50%; transform: translate(-50%, -50%); font-size: 18px; transition: left 1s ease; }
        .td-progress-pct { font-size: 12px; color: #999; text-align: right; }

        /* Timeline */
        .td-timeline-card { padding: 20px 0; }
        .td-timeline-card .td-card-title { padding: 0 20px 14px; border-bottom: 1px solid #f5f5f5; margin-bottom: 0; }
        .td-timeline-header {
          display: grid; grid-template-columns: 70px 40px 1fr 70px;
          padding: 10px 20px; background: #f8f9ff;
          font-size: 10px; color: #999; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.5px;
          gap: 0;
        }
        .td-timeline-header span:last-child { text-align: right; }

        .td-stop {
          display: grid; grid-template-columns: 70px 40px 1fr 70px;
          align-items: center; padding: 4px 20px 4px 20px;
          transition: background 0.2s; border-left: 3px solid transparent;
        }
        .td-stop-current { background: #fff8e1; border-left-color: #ff6f00; }
        .td-stop-passed { opacity: 0.7; }

        .td-time-col { display: flex; flex-direction: column; gap: 2px; }
        .td-time-right { text-align: right; align-items: flex-end; }
        .td-time-sched { font-size: 12px; font-weight: 600; }
        .td-time-live { font-size: 11px; color: #e65100; font-weight: 700; }

        .td-dot-col {
          display: flex; flex-direction: column; align-items: center;
          position: relative; min-height: 52px; padding: 0 8px;
        }
        .td-line { width: 2px; flex: 1; min-height: 14px; }
        .td-dot { border-radius: 50%; z-index: 1; flex-shrink: 0; transition: all 0.3s; }

        .td-stn-col { display: flex; flex-direction: column; gap: 2px; padding: 6px 8px; }
        .td-stn-name { font-size: 13px; transition: color 0.2s; line-height: 1.3; }
        .td-stn-code { font-size: 10px; color: #bbb; letter-spacing: 1px; }
        .td-stn-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 2px; }
        .td-day-badge {
          font-size: 10px; background: #e3f2fd; color: #1565c0;
          padding: 1px 6px; border-radius: 4px;
        }
        .td-here-tag { font-size: 11px; color: #ff6f00; font-weight: 700; }

        /* Runs on */
        .td-runs-card { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .td-runs-label { font-size: 13px; color: #666; font-weight: 600; }
        .td-day-chip { padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; }

        @media (max-width: 600px) {
          .td-train-num { font-size: 32px; }
          .td-timeline-header { grid-template-columns: 60px 32px 1fr 60px; font-size: 9px; padding: 8px 12px; }
          .td-stop { grid-template-columns: 60px 32px 1fr 60px; padding: 4px 12px; }
          .td-analytics { gap: 0; }
          .td-stat-val { font-size: 18px; }
        }
      `}</style>
    </div>
  );
}