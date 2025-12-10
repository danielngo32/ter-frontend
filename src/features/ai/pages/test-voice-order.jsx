import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Space, Typography, message } from 'antd';
import { AudioOutlined, StopOutlined, CloseOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { createSocketConnection, disconnectSocket } from '../../../utils/socketClient';
import { authService } from '../../auth/auth.service';

const { Title, Text } = Typography;

const TestVoiceOrderPage = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRealtimeRecording, setIsRealtimeRecording] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [realtimeSessionId, setRealtimeSessionId] = useState(null);
  const [status, setStatus] = useState('Disconnected');
  const [logs, setLogs] = useState([]);
  const [transcriptionText, setTranscriptionText] = useState('');

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const sessionIdRef = useRef(null);
  const realtimeSessionIdRef = useRef(null);
  const orderSessionIdRef = useRef(null); // voice order session persists across turns
  const pendingChunksRef = useRef([]);
  const isRecordingRef = useRef(false);
  const isRealtimeRecordingRef = useRef(false);
  const audioContextRef = useRef(null);
  const scriptProcessorRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const monitorAudioContextRef = useRef(null);
  const monitorProcessorRef = useRef(null);
  const monitorSourceRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const lastSoundTimeRef = useRef(0);
  const totalBytesRef = useRef(0);

  const ENABLE_AUTO_STOP = false; // disable auto-stop mic by default
  const SILENCE_THRESHOLD = 0.008; // RMS threshold (used only if auto-stop enabled)
  const SILENCE_TIMEOUT_MS = 5000; // auto-stop after 5s silence (if enabled)
  const MIN_AUTO_STOP_MS = 1500; // don't auto-stop in first 1.5s (if enabled)
  const MIN_AUDIO_BYTES = 16000; // ~1.5s; skip if below when stopping
  const recordStartTimeRef = useRef(0);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      disconnectSocket();
    };
  }, []);

  const addLog = (message, type = 'info') => {
    setLogs((prev) => [
      ...prev,
      {
        id: Date.now(),
        message,
        type,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const connect = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        message.error('Please login first');
        return;
      }

      addLog('Connecting to WebSocket...', 'info');
      setStatus('Connecting...');

      const socketInstance = createSocketConnection();

      socketInstance.on('connect', () => {
        addLog('✅ Connected to WebSocket server', 'success');
        setStatus('Connected');
        setIsConnected(true);
        setSocket(socketInstance);
        message.success('Connected to WebSocket');
      });

      socketInstance.on('disconnect', () => {
        addLog('❌ Disconnected from server', 'error');
        setStatus('Disconnected');
        setIsConnected(false);
        message.warning('Disconnected from WebSocket');
      });

      socketInstance.on('voice_session_started', (data) => {
        addLog(`✅ Session started: ${data.sessionId}`, 'success');
        setSessionId(data.sessionId);
        sessionIdRef.current = data.sessionId;
        if (data.orderSessionId) {
          orderSessionIdRef.current = data.orderSessionId;
        }
        
        // Send any pending chunks
        if (pendingChunksRef.current.length > 0) {
          pendingChunksRef.current.forEach((chunk) => {
            socketInstance.emit('audio_chunk', {
              sessionId: data.sessionId,
              chunk: chunk,
            });
          });
          pendingChunksRef.current = [];
        }
      });

      socketInstance.on('audio_chunk_received', (data) => {
        addLog(`📦 Chunk received: ${data.chunkIndex}, Size: ${data.totalSize} bytes`, 'info');
      });

      socketInstance.on('processing', (data) => {
        addLog(`⏳ Processing: ${data.status}`, 'info');
        setStatus(`Processing: ${data.status}`);
      });

      socketInstance.on('partial_transcription', (data) => {
        // Append partial transcription to existing text
        setTranscriptionText((prev) => {
          // If it's a new partial transcription, append with space
          // Otherwise, replace the last partial text
          const newText = prev ? `${prev} ${data.text}` : data.text;
          return newText;
        });
        addLog(`📝 Partial: "${data.text}"`, 'info');
      });

      // --- Realtime handlers ---
      socketInstance.on('realtime_session_started', (data) => {
        addLog(`⚡ Realtime session started: ${data.sessionId}`, 'success');
        setRealtimeSessionId(data.sessionId);
        realtimeSessionIdRef.current = data.sessionId;
      });

      // Realtime delta (OpenAI Realtime)
      socketInstance.on('transcription_delta', (data) => {
        setTranscriptionText((prev) => `${prev}${data.text}`);
        addLog(`📝 Delta: "${data.text}"`, 'info');
      });

      socketInstance.on('transcription', (data) => {
        // Final transcription - replace all partial text with final result
        setTranscriptionText(data.text);
        addLog(`📝 Final Transcription: "${data.text}"`, 'success');
        message.info(`Transcription: ${data.text}`);
      });

      socketInstance.on('realtime_session_disconnected', () => {
        addLog('⚡ Realtime session disconnected', 'info');
        resetRealtime();
      });

      socketInstance.on('realtime_cancelled', () => {
        addLog('⚡ Realtime session cancelled', 'info');
        resetRealtime();
      });

      socketInstance.on('voice_response', (data) => {
        addLog(`✅ Response: ${data.content}`, 'success');
        if (data.orderId) {
          addLog(`📦 Order created: ${data.orderNumber || data.orderId}, Total: ${data.total}`, 'success');
          message.success(`Order created: ${data.orderNumber || data.orderId}`);
        } else {
          message.success('Request processed');
        }
        setStatus('Completed');
        resetRecording(); // keep orderSessionId for next turns
      });

      socketInstance.on('voice_cancelled', () => {
        addLog('❌ Recording cancelled', 'error');
        resetRecording();
      });

      socketInstance.on('error', (data) => {
        addLog(`❌ Error: ${data.message} (${data.code})`, 'error');
        setStatus(`Error: ${data.message}`);
        message.error(data.message);
      });

      socketInstance.on('connect_error', (error) => {
        addLog(`❌ Connection error: ${error.message}`, 'error');
        setStatus('Connection failed');
        message.error(`Connection failed: ${error.message}`);
      });
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
      message.error(error.message);
    }
  };

  const startRecording = async () => {
    try {
      if (!socket || !isConnected) {
        message.error('Not connected to WebSocket');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && isRecordingRef.current) {
          totalBytesRef.current += event.data.size;
          audioChunksRef.current.push(event.data);

          const reader = new FileReader();
          reader.onloadend = () => {
            // Only send if still recording and sessionId exists
            if (!isRecordingRef.current) {
              return;
            }
            
            const base64Audio = reader.result.split(',')[1];
            const currentSessionId = sessionIdRef.current;
            
            if (socket && currentSessionId && isRecordingRef.current) {
              socket.emit('audio_chunk', {
                sessionId: currentSessionId,
                chunk: base64Audio,
              });
            } else if (isRecordingRef.current) {
              // Store for later if sessionId not ready yet
              pendingChunksRef.current.push(base64Audio);
              if (process.env.NODE_ENV === 'development') {
                console.log('Buffering chunk, waiting for sessionId...');
              }
            }
          };
          reader.readAsDataURL(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };

      // Emit voice_start and wait for sessionId before starting recorder
      addLog('Starting voice session...', 'info');
      socket.emit('voice_start', { orderSessionId: orderSessionIdRef.current || null });
      
      // Start recording immediately, chunks will be buffered if needed
      mediaRecorder.start(1000);
      totalBytesRef.current = 0;
      recordStartTimeRef.current = Date.now();

      // Optional auto-stop (disabled by default)
      if (ENABLE_AUTO_STOP) {
        startSilenceMonitor(stream, () => {
          if (
            isRecordingRef.current &&
            sessionIdRef.current &&
            Date.now() - recordStartTimeRef.current > MIN_AUTO_STOP_MS
          ) {
            addLog('🔇 Auto-stop: silence detected', 'info');
            stopRecording();
          }
        });
      }

      addLog('🎤 Recording started...', 'success');
      setStatus('Recording...');
      setIsRecording(true);
      isRecordingRef.current = true;
      message.success('Recording started');
    } catch (error) {
      addLog(`❌ Error starting recording: ${error.message}`, 'error');
      message.error(`Error accessing microphone: ${error.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      isRecordingRef.current = false;
      mediaRecorderRef.current.stop();
      stopSilenceMonitor();
      addLog('🛑 Recording stopped, processing...', 'info');
      setStatus('Processing...');

      if (totalBytesRef.current < MIN_AUDIO_BYTES) {
        addLog('⚠️ Audio quá ngắn, bỏ qua gửi backend', 'warning');
        resetRecording();
        message.warning('Âm thanh quá ngắn, hãy nói rõ hơn.');
        return;
      }

      if (socket && sessionIdRef.current) {
        socket.emit('voice_stop', {
          sessionId: sessionIdRef.current,
        });
        addLog('📤 Đã gửi voice_stop', 'info');
      } else {
        addLog('⚠️ Chưa có sessionId, không gửi voice_stop', 'warning');
      }

      setIsRecording(false);
    }
  };

  // Realtime via PCM16 16k mono sent to backend proxy
  const startRealtime = async () => {
    try {
      if (!socket || !isConnected) {
        message.error('Not connected to WebSocket');
        return;
      }

      addLog('Starting realtime session...', 'info');
      socket.emit('realtime_start', { orderSessionId: orderSessionIdRef.current || null });

      // Capture mic with AudioContext @16k, convert Float32 -> Int16 PCM
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (!isRealtimeRecordingRef.current) return;
        const input = event.inputBuffer.getChannelData(0);
        const pcm16 = float32ToInt16PCM(input);
        const b64 = Buffer.from(pcm16.buffer).toString('base64');
        const sid = realtimeSessionIdRef.current;
        if (socket && sid) {
          socket.emit('realtime_audio_chunk', { sessionId: sid, chunk: b64 });
        }

        // Silence detection for realtime
        const rms = Math.sqrt(input.reduce((s, v) => s + v * v, 0) / input.length);
        if (rms > SILENCE_THRESHOLD) {
          lastSoundTimeRef.current = Date.now();
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setStatus('Realtime recording...');
      setIsRealtimeRecording(true);
      isRealtimeRecordingRef.current = true;
      startSilenceTimer(() => {
        if (isRealtimeRecordingRef.current) {
          addLog('🔇 Auto-stop realtime: silence detected', 'info');
          stopRealtime();
        }
      });
      message.success('Realtime recording started');
    } catch (error) {
      addLog(`❌ Error starting realtime: ${error.message}`, 'error');
      message.error(error.message);
      resetRealtime();
    }
  };

  const stopRealtime = () => {
    isRealtimeRecordingRef.current = false;
    teardownRealtimeAudio();
  stopSilenceTimer();
    addLog('🛑 Realtime recording stopped, requesting transcription...', 'info');
    setStatus('Processing (realtime)...');
    if (socket && realtimeSessionIdRef.current) {
      socket.emit('realtime_stop', { sessionId: realtimeSessionIdRef.current });
    }
    setIsRealtimeRecording(false);
  };

  const cancelRealtime = () => {
    isRealtimeRecordingRef.current = false;
    teardownRealtimeAudio();
  stopSilenceTimer();
    if (socket && realtimeSessionIdRef.current) {
      socket.emit('realtime_cancel', { sessionId: realtimeSessionIdRef.current });
    }
    resetRealtime();
    addLog('Realtime cancelled', 'info');
  };

  const cancelRecording = () => {
    isRecordingRef.current = false;
    stopSilenceMonitor();
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (socket && sessionId) {
      socket.emit('voice_cancel', {
        sessionId: sessionId,
      });
    }

    resetRecording();
    message.info('Recording cancelled');
  };

  const resetRecording = () => {
    setSessionId(null);
    sessionIdRef.current = null;
    audioChunksRef.current = [];
    pendingChunksRef.current = [];
    setIsRecording(false);
    isRecordingRef.current = false;
    setTranscriptionText('');
    totalBytesRef.current = 0;
  };

  const resetRealtime = () => {
    setRealtimeSessionId(null);
    realtimeSessionIdRef.current = null;
    setIsRealtimeRecording(false);
    isRealtimeRecordingRef.current = false;
    teardownRealtimeAudio();
  };

  const teardownRealtimeAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current.onaudioprocess = null;
      scriptProcessorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  // Helper: Float32Array -> Int16Array PCM
  const float32ToInt16PCM = (input) => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      let s = input[i];
      s = s < -1 ? -1 : s > 1 ? 1 : s;
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  };

  // Silence monitor for MediaRecorder path (Whisper HTTP)
  const startSilenceMonitor = (stream, onSilence) => {
    stopSilenceMonitor();
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      lastSoundTimeRef.current = Date.now();
      processor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        const rms = Math.sqrt(input.reduce((s, v) => s + v * v, 0) / input.length);
        if (rms > SILENCE_THRESHOLD) {
          lastSoundTimeRef.current = Date.now();
        }
      };
      source.connect(processor);
      processor.connect(ctx.destination);
      monitorAudioContextRef.current = ctx;
      monitorProcessorRef.current = processor;
      monitorSourceRef.current = source;
      silenceTimerRef.current = setInterval(() => {
        if (Date.now() - lastSoundTimeRef.current > SILENCE_TIMEOUT_MS) {
          onSilence();
        }
      }, 500);
    } catch (err) {
      console.error('Silence monitor error:', err);
    }
  };

  const stopSilenceMonitor = () => {
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (monitorProcessorRef.current) {
      monitorProcessorRef.current.disconnect();
      monitorProcessorRef.current.onaudioprocess = null;
      monitorProcessorRef.current = null;
    }
    if (monitorSourceRef.current) {
      monitorSourceRef.current.disconnect();
      monitorSourceRef.current = null;
    }
    if (monitorAudioContextRef.current) {
      monitorAudioContextRef.current.close().catch(() => {});
      monitorAudioContextRef.current = null;
    }
  };

  // Silence timer for realtime path (AudioContext already active)
  const startSilenceTimer = (onSilence) => {
    stopSilenceTimer();
    lastSoundTimeRef.current = Date.now();
    silenceTimerRef.current = setInterval(() => {
      if (Date.now() - lastSoundTimeRef.current > SILENCE_TIMEOUT_MS) {
        onSilence();
      }
    }, 500);
  };

  const stopSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const disconnect = () => {
    if (isRecording) {
      cancelRecording();
    }
    disconnectSocket();
    setSocket(null);
    setIsConnected(false);
    setStatus('Disconnected');
    addLog('Disconnected from WebSocket', 'info');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <Title level={2}>🎤 Test Voice Order</Title>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space>
            {!isConnected ? (
              <Button type="primary" onClick={connect}>
                Connect
              </Button>
            ) : (
              <Button danger onClick={disconnect}>
                Disconnect
              </Button>
            )}
            <Button
              type="primary"
              icon={<AudioOutlined />}
              onClick={startRecording}
              disabled={!isConnected || isRecording}
            >
              Start Recording
            </Button>
            <Button
              danger
              icon={<StopOutlined />}
              onClick={stopRecording}
              disabled={!isRecording}
            >
              Stop & Process
            </Button>
            <Button
              icon={<CloseOutlined />}
              onClick={cancelRecording}
              disabled={!isRecording}
            >
              Cancel
            </Button>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={startRealtime}
            disabled={!isConnected || isRealtimeRecording}
          >
            Start Realtime (PCM16)
          </Button>
          <Button
            danger
            icon={<StopOutlined />}
            onClick={stopRealtime}
            disabled={!isRealtimeRecording}
          >
            Stop Realtime
          </Button>
          <Button
            icon={<CloseOutlined />}
            onClick={cancelRealtime}
            disabled={!isRealtimeRecording}
          >
            Cancel Realtime
          </Button>
            <Button
              type="default"
              onClick={startRealtime}
              disabled={!isConnected || isRealtimeRecording}
            >
              Start Realtime
            </Button>
            <Button
              danger
              onClick={stopRealtime}
              disabled={!isRealtimeRecording}
            >
              Stop Realtime
            </Button>
            <Button
              onClick={cancelRealtime}
              disabled={!isRealtimeRecording}
            >
              Cancel Realtime
            </Button>
          </Space>

          <div>
            <Text strong>Status: </Text>
            <Text type={isConnected ? 'success' : 'danger'}>{status}</Text>
          </div>

          {isRecording && (
            <Card title="🎤 Real-time Transcription" size="small" style={{ backgroundColor: '#f0f2f5' }}>
              <div
                style={{
                  minHeight: '100px',
                  padding: '16px',
                  backgroundColor: '#fff',
                  borderRadius: '4px',
                  border: '1px solid #d9d9d9',
                }}
              >
                {transcriptionText ? (
                  <Text style={{ fontSize: '16px', lineHeight: '1.6' }}>{transcriptionText}</Text>
                ) : (
                  <Text type="secondary" style={{ fontStyle: 'italic' }}>
                    Đang nghe... (text sẽ hiển thị ở đây khi bạn nói)
                  </Text>
                )}
              </div>
            </Card>
          )}

          <Card title="Logs" size="small" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {logs.length === 0 ? (
              <Text type="secondary">No logs yet</Text>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    marginBottom: '8px',
                    padding: '8px',
                    borderLeft: `3px solid ${
                      log.type === 'error'
                        ? '#ff4d4f'
                        : log.type === 'success'
                        ? '#52c41a'
                        : '#1890ff'
                    }`,
                    backgroundColor: '#f5f5f5',
                  }}
                >
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    [{log.timestamp}]
                  </Text>{' '}
                  <Text>{log.message}</Text>
                </div>
              ))
            )}
          </Card>
        </Space>
      </Card>
    </div>
  );
};

export default TestVoiceOrderPage;

