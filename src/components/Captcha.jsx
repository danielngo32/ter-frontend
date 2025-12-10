import React, { useRef, useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';

const Captcha = ({ value, onChange, onRefresh }) => {
  const canvasRef = useRef(null);
  const [captchaValue, setCaptchaValue] = useState('');
  const seedRef = useRef(Math.random());

  const generateCaptcha = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    seedRef.current = Math.random();
    return result;
  }, []);

  const drawCaptcha = useCallback((text, seed) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = 80;
    const height = 36;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);

    const rng = (() => {
      let s = seed;
      return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
    })();

    for (let i = 0; i < 100; i++) {
      const x = rng() * width;
      const y = rng() * height;
      const gray = Math.floor(rng() * 120);
      ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
      ctx.fillRect(x, y, 1, 1);
    }

    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(0, 0, 0, ${rng() * 0.15 + 0.05})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rng() * width, rng() * height);
      ctx.lineTo(rng() * width, rng() * height);
      ctx.stroke();
    }

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const chars = text.split('');
    const totalChars = chars.length;
    const padding = 6;
    const availableWidth = width - (padding * 2);
    const charWidth = 16;
    const spacing = 0;
    const totalWidth = (charWidth * totalChars) + (spacing * (totalChars - 1));
    const startX = padding + (availableWidth - totalWidth) / 2;
    const baseY = height / 2;

    chars.forEach((char, index) => {
      const x = startX + (charWidth * index) + (charWidth / 2);
      const rotation = (rng() - 0.5) * 0.12;
      const offsetY = (rng() - 0.5) * 2;

      ctx.save();
      ctx.translate(x, baseY + offsetY);
      ctx.rotate(rotation);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });
  }, []);

  useEffect(() => {
    if (value && value.length > 0 && value !== captchaValue) {
      setCaptchaValue(value);
      seedRef.current = Math.random();
      requestAnimationFrame(() => {
        drawCaptcha(value, seedRef.current);
      });
      return;
    }
    
    if ((!value || value === '') && !captchaValue) {
      const newCaptcha = generateCaptcha();
      setCaptchaValue(newCaptcha);
      requestAnimationFrame(() => {
        drawCaptcha(newCaptcha, seedRef.current);
      });
      if (onChange) {
        onChange(newCaptcha);
      }
      return;
    }
    
    if (value === '' && captchaValue) {
      const newCaptcha = generateCaptcha();
      setCaptchaValue(newCaptcha);
      seedRef.current = Math.random();
      requestAnimationFrame(() => {
        drawCaptcha(newCaptcha, seedRef.current);
      });
      if (onChange) {
        onChange(newCaptcha);
      }
      return;
    }
    
    if (captchaValue && (!value || value === captchaValue)) {
      requestAnimationFrame(() => {
        drawCaptcha(captchaValue, seedRef.current);
      });
    }
  }, [value]);

  const handleRefresh = () => {
    const newCaptcha = generateCaptcha();
    setCaptchaValue(newCaptcha);
    seedRef.current = Math.random();
    requestAnimationFrame(() => {
      drawCaptcha(newCaptcha, seedRef.current);
    });
    if (onChange) {
      onChange(newCaptcha);
    }
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleCanvasClick = () => {
    handleRefresh();
  };

  return (
    <CaptchaWrapper>
      <Canvas ref={canvasRef} onClick={handleCanvasClick} />
    </CaptchaWrapper>
  );
};

export default Captcha;

const CaptchaWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const Canvas = styled.canvas`
  width: 80px;
  height: 36px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  background: #fafafa;
  display: block;
`;