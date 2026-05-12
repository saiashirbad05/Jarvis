import './ServiceTicker.css'

const TECH_LOGOS = [
  { name: 'Next.js', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg' },
  { name: 'React', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
  { name: 'HTML5', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg' },
  { name: 'CSS3', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg' },
  { name: 'JavaScript', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
  { name: 'GitHub', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg' },
  { name: 'Python', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
  { name: 'GCP', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg' },
  { name: 'PostgreSQL', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg' },
  { name: 'Google', url: 'https://www.gstatic.com/images/branding/googlelogo/svg/googlelogo_clr_74x24px.svg' },
  { name: 'Cloud Run', url: '/555/run.png' },
  { name: 'Cloud SQL', url: '/555/cloudsql.png' },
  { name: 'Antigravity', url: '/555/antigravity.jpg' },
  { name: 'ADK', url: '/555/adk.png' },
]

export default function ServiceTicker() {
  // Duplicate for seamless loop
  const items = [...TECH_LOGOS, ...TECH_LOGOS]

  return (
    <div className="ticker">
      <div className="ticker-track">
        {items.map((tech, i) => (
          <span key={i} className="ticker-item-wrap">
            <img src={tech.url} alt={tech.name} className="ticker-logo" title={tech.name} />
          </span>
        ))}
      </div>
    </div>
  )
}
