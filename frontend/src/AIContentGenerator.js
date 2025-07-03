import React, { useState, useEffect, useRef } from 'react';

const QUESTIONS = [
	{
		text: 'Is this for a New Client or Existing Client?',
		type: 'options',
		options: ['New Client', 'Existing Client'],
	},
	{
		text: 'What does this brand want to be known for? What’s their core identity?',
		type: 'text',
	},
	{
		text: 'What products or services need the most awareness this month?',
		type: 'text',
	},
	{
		text: 'Who is the ideal customer? Tell me about their demographics, interests, and pain points:',
		type: 'text',
	},
	{
		text: 'What specific pain points does this brand solve for customers?',
		type: 'text',
	},
	{
		text: 'Are there any seasonal events, product launches, or trending topics we should capitalize on this month?',
		type: 'text',
	},
	{
		text: 'What tone best fits the brand personality?',
		type: 'options',
		options: [
			'Formal & Professional',
			'Friendly & Approachable',
			'Bold & Confident',
			'Educational & Expert',
			'Playful & Creative',
		],
	},
	{
		text: 'Who are the key competitors we should be aware of? (This helps us differentiate the content)',
		type: 'text',
	},
	{
		text: 'Which platforms should we focus on?',
		type: 'options',
		options: [
			'Instagram + Stories',
			'TikTok + Reels',
			'LinkedIn Professional',
			'Facebook + Community',
			'Twitter/X + Threads',
			'YouTube + Shorts',
			'Multi-Platform Mix',
		],
	},
	{
		text: 'How many posts per week feels right for this brand?',
		type: 'options',
		options: [
			'3 posts/week (Focused)',
			'4 posts/week (Balanced)',
			'5 posts/week (Active)',
			'6–7 posts/week (High Volume)',
			'Custom Frequency',
		],
	},
	{
		text: 'Would you like me to include trending content suggestions specific to your industry?',
		type: 'options',
		options: ['Yes, include trends', 'Focus on evergreen content'],
	},
	{
		text: 'Would you like me to suggest optimal posting times based on your audience, or use standard recommendations?',
		type: 'options',
		options: [
			'Suggest optimal times',
			'Use standard times',
			'I’ll set times manually ',
		],
	},
];

export default function AIContentGenerator({ user, client, onBack }) {
	const [messages, setMessages] = useState([]);
	const [step, setStep] = useState(0);
	const [showInput, setShowInput] = useState(false);
	const [answers, setAnswers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [existingClients, setExistingClients] = useState([]);
	// Commented out unused state variable
	// const [selectedExistingClient, setSelectedExistingClient] = useState(null);
	const [, setSelectedExistingClient] = useState(null); // Keep setter but mark variable as unused
	const chatEndRef = useRef(null);

	// Scroll to bottom on new message
	useEffect(() => {
		if (chatEndRef.current) {
			chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [messages]);

	// Fetch existing clients
	useEffect(() => {
		async function fetchClients() {
			try {
				const res = await fetch('/api/clients');
				if (res.ok) {
					const clientsData = await res.json();
					setExistingClients(clientsData);
				}
			} catch (err) {
				console.error('Error fetching clients:', err);
			}
		}
		fetchClients();
	}, []);

	// Start the chat flow on mount
	useEffect(() => {
		setMessages([
			{ sender: 'ai', text: 'Welcome to the Content Creator Agent!' },
		]);
		setTimeout(() => {
			askQuestion(0);
		}, 500);
		setStep(0);
		setShowInput(false);
		setAnswers([]);
	}, []);

	function askQuestion(idx) {
		const q = QUESTIONS[idx];
		if (!q) return;
		setMessages((prev) => [
			...prev,
			{
				sender: 'ai',
				text: q.text,
				options: q.type === 'options' ? q.options : undefined,
			},
		]);
		setShowInput(q.type === 'text');
	}

	function addUserMessage(text) {
		setMessages((prev) => [...prev, { sender: 'user', text }]);
	}

	function handleOptionClick(option) {
		addUserMessage(option);
		setAnswers((prev) => [...prev, option]);

		// Handle first question (New vs Existing Client)
		if (step === 0) {
			if (option === 'Existing Client') {
				// Show existing clients as options
				setTimeout(() => {
					const clientOptions = existingClients.map(
						(c) => `${c.name} (${c.industry || 'Business'})`
					);
					if (clientOptions.length > 0) {
						setMessages((prev) => [
							...prev,
							{
								sender: 'ai',
								text: 'Perfect! Which existing client would you like to create content for?',
								options: clientOptions,
							},
						]);
						setShowInput(false);
					} else {
						setMessages((prev) => [
							...prev,
							{
								sender: 'ai',
								text: 'No existing clients found. Please add clients first or choose "New Client".',
							},
						]);
						setShowInput(false);
					}
				}, 500);
				return; // Don't increment step yet
			} else {
				// New Client - continue with normal flow
				const nextStep = step + 1;
				setStep(nextStep);
				setShowInput(false);
				setTimeout(() => {
					askQuestion(nextStep);
				}, 500);
			}
		}
		// Handle existing client selection
		else if (step === 0 && answers[0] === 'Existing Client') {
			// Extract client name from the option (remove industry part)
			const clientName = option.split(' (')[0];
			const selectedClient = existingClients.find((c) => c.name === clientName);
			setSelectedExistingClient(selectedClient);

			// For existing clients, skip to content generation
			setTimeout(() => {
				generateExistingClientContent(selectedClient, option);
			}, 500);
		}
		// Normal flow for new clients
		else {
			const nextStep = step + 1;
			setStep(nextStep);
			setShowInput(false);
			setTimeout(() => {
				askQuestion(nextStep);
			}, 500);
		}
	}

	function handleInputSend(e) {
		e.preventDefault();
		const input = e.target.elements['aiTextInput'];
		const value = input.value.trim();
		if (!value) return;
		addUserMessage(value);
		setAnswers((prev) => [...prev, value]);
		input.value = '';
		const nextStep = step + 1;
		setStep(nextStep);
		setShowInput(false);
		setTimeout(() => {
			askQuestion(nextStep);
		}, 500);
	}

	async function generateExistingClientContent(selectedClient, clientOption) {
		setLoading(true);
		setMessages((prev) => [
			...prev,
			{ sender: 'ai', text: `Generating a 30-day content plan for ${selectedClient.name}. Please wait...` },
		]);

		try {
			// Use existing client data to generate content
			const existingClientAnswers = [
				'Existing Client',
				clientOption,
				selectedClient.description || 'Professional services business',
				selectedClient.industry || 'Business services',
				'Current customers and prospects in the target market',
				'Efficiency, reliability, and quality service delivery',
				'Industry trends and seasonal business cycles',
				'Professional & Approachable',
				'Industry competitors and market leaders',
				'LinkedIn Professional',
				'4 posts/week (Balanced)',
				'Yes, include trends',
				'Suggest optimal times',
			];

			const res = await fetch('/api/ai/generate-content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ answers: existingClientAnswers }),
			});

			const data = await res.json();
			if (data.content_plan) {
				setMessages((prev) => [...prev, { sender: 'ai', text: data.content_plan }]);
			} else {
				setMessages((prev) => [...prev, { sender: 'ai', text: 'Sorry, there was a problem generating your content plan.' }]);
			}
		} catch (err) {
			setMessages((prev) => [...prev, { sender: 'ai', text: 'Error contacting AI service.' }]);
		}
		setLoading(false);
	}

	// Generate content for new clients after all questions
	useEffect(() => {
		async function fetchContentPlan() {
			// Only generate for new clients who answered all questions
			if (answers[0] === 'New Client' && step === QUESTIONS.length && answers.length === QUESTIONS.length) {
				setLoading(true);
				setMessages((prev) => [...prev, { sender: 'ai', text: 'Generating your 30-day content plan. Please wait...' }]);
				try {
					const res = await fetch('/api/ai/generate-content', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ answers }),
					});
					const data = await res.json();
					if (data.content_plan) {
						setMessages((prev) => [...prev, { sender: 'ai', text: data.content_plan }]);
					} else {
						setMessages((prev) => [...prev, { sender: 'ai', text: 'Sorry, there was a problem generating your content plan.' }]);
					}
				} catch (err) {
					setMessages((prev) => [...prev, { sender: 'ai', text: 'Error contacting AI service.' }]);
				}
				setLoading(false);
				setShowInput(false);
			}
		}
		fetchContentPlan();
	}, [step, answers]);

	return (
		<div style={{ minHeight: '100vh', background: '#111', padding: '2rem' }}>
			<style>{`
        .ai-chat-container {
          background: #181818;
          border-radius: 18px;
          box-shadow: 0 4px 32px rgba(255, 214, 0, 0.1);
          border: 2px solid #FFD600;
          height: calc(100vh - 4rem);
          display: flex;
          flex-direction: column;
          max-width: 1200px;
          margin: 0 auto;
        }
        .chat-header {
          background: #FFD600;
          color: #111;
          padding: 1.5rem 2rem;
          border-radius: 16px 16px 0 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .chat-messages {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .message {
          max-width: 70%;
          padding: 1rem 1.5rem;
          border-radius: 18px;
          word-wrap: break-word;
          white-space: pre-wrap;
        }
        .message.user {
          background: #FFD600;
          color: #111;
          align-self: flex-end;
          margin-left: auto;
        }
        .message.ai {
          background: #222;
          color: #FFD600;
          border: 1px solid #333;
          align-self: flex-start;
        }
        .chat-input-container {
          padding: 2rem;
          border-top: 1px solid #333;
          display: flex;
          gap: 1rem;
          align-items: flex-end;
        }
        .chat-input {
          flex: 1;
          background: #222;
          border: 2px solid #333;
          border-radius: 12px;
          color: #FFD600;
          padding: 1rem;
          font-size: 16px;
          resize: vertical;
          min-height: 50px;
          max-height: 150px;
        }
        .chat-input:focus {
          outline: none;
          border-color: #FFD600;
        }
        .send-button {
          background: #FFD600;
          color: #111;
          border: none;
          border-radius: 12px;
          padding: 1rem 2rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .send-button:hover {
          background: #fff200;
          transform: translateY(-2px);
        }
        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        .back-button {
          background: #222;
          color: #FFD600;
          border: 2px solid #FFD600;
          border-radius: 10px;
          padding: 0.5rem 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .back-button:hover {
          background: #333;
        }
        .option-btn {
          background: #FFD600;
          color: #111;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          margin: 0.5rem 0.5rem 0 0;
          padding: 0.5rem 1.5rem;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .option-btn:hover {
          background: #fff200;
        }
      `}</style>

			<div className="ai-chat-container">
				{/* Header */}
				<div className="chat-header">
					<div>
						<h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900' }}>
							🧠 Content Creator Agent
						</h1>
						<p style={{ margin: '0.5rem 0 0 0', opacity: 0.8 }}>
							Auto-Generate 30 Days of Engaging Content
						</p>
					</div>
					<button className="back-button" onClick={onBack}>
						← Back to {client ? `${client.name} Calendar` : 'Calendar'}
					</button>
				</div>

				{/* Messages */}
				<div className="chat-messages">
					{messages.map((msg, idx) => (
						<div key={idx} className={`message ${msg.sender}`}>
							{msg.text}
							{msg.options && (
								<div style={{ marginTop: 12 }}>
									{msg.options.map((opt) => (
										<button
											key={opt}
											className="option-btn"
											onClick={() => handleOptionClick(opt)}
										>
											{opt}
										</button>
									))}
								</div>
							)}
						</div>
					))}
					<div ref={chatEndRef} />
				</div>

				{/* Input */}
				{showInput && !loading && (
					<form className="chat-input-container" onSubmit={handleInputSend}>
						<input
							className="chat-input"
							name="aiTextInput"
							placeholder="Type your response..."
							autoComplete="off"
						/>
						<button className="send-button" type="submit">
							Send
						</button>
					</form>
				)}
				{loading && (
					<div
						className="chat-input-container"
						style={{ color: '#FFD600', fontWeight: 700 }}
					>
						Generating content plan...
					</div>
				)}
			</div>

			{/* Move any reusable business logic to core/businessLogic.js for architecture consistency. */}
		</div>
	);
}
