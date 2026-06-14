import { gsap } from 'gsap'

/**
 * 元素淡入入场动画
 * @param {string|Element|Element[]} targets - 选择器或元素
 * @param {Object} options - 配置项
 * @param {number} options.duration - 动画时长，默认 0.6
 * @param {number} options.stagger - 交错时间，默认 0.1
 * @param {number} options.delay - 延迟时间，默认 0
 * @param {string} options.y - Y轴偏移，默认 30
 */
export const fadeInUp = (targets, options = {}) => {
  return gsap.fromTo(
    targets,
    { opacity: 0, y: options.y || 30 },
    {
      opacity: 1,
      y: 0,
      duration: options.duration || 0.6,
      ease: 'power2.out',
      stagger: options.stagger || 0.1,
      delay: options.delay || 0,
    }
  )
}

/**
 * 滑入动画（从左侧或右侧）
 * @param {string|Element|Element[]} targets - 选择器或元素
 * @param {Object} options - 配置项
 */
export const slideIn = (targets, options = {}) => {
  const x = options.from === 'right' ? 50 : options.from === 'left' ? -50 : 0
  return gsap.fromTo(
    targets,
    { opacity: 0, x },
    {
      opacity: 1,
      x: 0,
      duration: options.duration || 0.5,
      ease: 'power2.out',
      stagger: options.stagger || 0.1,
      delay: options.delay || 0,
    }
  )
}

/**
 * 数字滚动动画
 * @param {number} endValue - 目标数值
 * @param {Object} options - 配置项
 * @param {Function} options.onUpdate - 数值更新回调
 * @param {number} options.duration - 动画时长，默认 1.5
 */
export const countUp = (endValue, options = {}) => {
  const obj = { value: 0 }
  return gsap.to(obj, {
    value: endValue,
    duration: options.duration || 1.5,
    ease: 'power2.out',
    onUpdate: () => {
      if (options.onUpdate) {
        options.onUpdate(Math.round(obj.value))
      }
    },
  })
}

/**
 * 卡片悬停浮起效果
 * @param {Element} card - 卡片元素
 */
export const setupCardHover = (card) => {
  gsap.set(card, { y: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' })

  card.addEventListener('mouseenter', () => {
    gsap.to(card, {
      y: -6,
      boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
      duration: 0.3,
      ease: 'power2.out',
    })
  })

  card.addEventListener('mouseleave', () => {
    gsap.to(card, {
      y: 0,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      duration: 0.3,
      ease: 'power2.out',
    })
  })
}

/**
 * 缩放入场动画
 * @param {string|Element|Element[]} targets - 选择器或元素
 * @param {Object} options - 配置项
 */
export const scaleIn = (targets, options = {}) => {
  return gsap.fromTo(
    targets,
    { opacity: 0, scale: options.from || 0.8 },
    {
      opacity: 1,
      scale: 1,
      duration: options.duration || 0.5,
      ease: 'back.out(1.7)',
      stagger: options.stagger || 0.1,
      delay: options.delay || 0,
    }
  )
}

/**
 * 按钮点击反馈动画
 * @param {Element} button - 按钮元素
 */
export const setupButtonClick = (button) => {
  button.addEventListener('mousedown', () => {
    gsap.to(button, {
      scale: 0.95,
      duration: 0.1,
      ease: 'power2.out',
    })
  })

  button.addEventListener('mouseup', () => {
    gsap.to(button, {
      scale: 1,
      duration: 0.2,
      ease: 'elastic.out(1, 0.5)',
    })
  })
}

/**
 * 批量设置卡片悬停效果
 * @param {string} selector - 选择器
 * @param {Element} container - 容器元素
 */
export const setupCardsHover = (selector, container = document) => {
  const cards = container.querySelectorAll(selector)
  cards.forEach((card) => setupCardHover(card))
}

/**
 * 批量设置按钮点击效果
 * @param {string} selector - 选择器
 * @param {Element} container - 容器元素
 */
export const setupButtonsClick = (selector, container = document) => {
  const buttons = container.querySelectorAll(selector)
  buttons.forEach((button) => setupButtonClick(button))
}

export { gsap }
