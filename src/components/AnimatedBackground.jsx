"use client";

import { useEffect, useRef } from "react";

export default function AnimatedBackground({ children }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let animationId;

    const mouse = { x: -9999, y: -9999 };
    const mouseRadius = 160;

    // eslint-disable-next-line no-unused-vars
    const particleCount = Math.floor((width * height) / 8000);
    let particles = [];

    function createParticles() {
      particles = [];
      const count = Math.min(Math.floor((width * height) / 8000), 300);
      for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: 0,
          vy: 0,
          radius: Math.random() * 1.8 + 0.6,
          opacity: Math.random() * 0.5 + 0.2,
          speed: Math.random() * 0.3 + 0.1,
          angle: Math.random() * Math.PI * 2,
          angleSpeed: (Math.random() - 0.5) * 0.008,
          drift: Math.random() * 30 + 15,
        });
      }
    }

    createParticles();

    const connectionDistance = 130;

    function drawConnections() {
      if (!ctx) return;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const opacity = (1 - dist / connectionDistance) * 0.15;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(148, 196, 255, ${opacity})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function drawMouseConnections() {
      if (!ctx || mouse.x === -9999) return;
      for (let i = 0; i < particles.length; i++) {
        const dx = particles[i].x - mouse.x;
        const dy = particles[i].y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouseRadius * 1.5) {
          const opacity = (1 - dist / (mouseRadius * 1.5)) * 0.25;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(100, 180, 255, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      drawConnections();
      drawMouseConnections();

      particles.forEach((p) => {
        p.angle += p.angleSpeed;
        const targetX = p.baseX + Math.cos(p.angle) * p.drift;
        const targetY = p.baseY + Math.sin(p.angle * 0.7) * p.drift * 0.6;

        // Mouse repulsion
        const dxMouse = p.x - mouse.x;
        const dyMouse = p.y - mouse.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        let pushX = 0;
        let pushY = 0;
        if (distMouse < mouseRadius && distMouse > 0) {
          const force = (1 - distMouse / mouseRadius) * 3;
          pushX = (dxMouse / distMouse) * force;
          pushY = (dyMouse / distMouse) * force;
        }

        p.vx += (targetX - p.x) * 0.02 + pushX;
        p.vy += (targetY - p.y) * 0.02 + pushY;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.x += p.vx;
        p.y += p.vy;

        // Glow effect
        const glowRadius = p.radius * 4;
        const gradient = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          glowRadius
        );
        gradient.addColorStop(
          0,
          `rgba(148, 210, 255, ${p.opacity * 0.8})`
        );
        gradient.addColorStop(
          0.4,
          `rgba(148, 196, 255, ${p.opacity * 0.2})`
        );
        gradient.addColorStop(1, `rgba(148, 196, 255, 0)`);

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.fillStyle = `rgba(200, 225, 255, ${p.opacity + 0.3})`;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    }

    animate();

    function handleResize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      createParticles();
    }

    function handleMouseMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }

    function handleMouseLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

return (
  <div style={{ 
    position: "relative", 
    minHeight: "100vh",
    width: "100%",
    overflow: "hidden"
  }}>
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",  // Cambiá de fixed a absolute
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        minHeight: "100vh",   // Agregá esto
        zIndex: 0,
        background: "radial-gradient(ellipse at 50% 30%, #0a1628 0%, #030a14 60%, #010409 100%)",
        pointerEvents: "none"
      }}
    />
    <div style={{ 
      position: "relative", 
      zIndex: 1,
      width: "100%",
      minHeight: "100vh"
    }}>
      {children}
    </div>
  </div>
);
}