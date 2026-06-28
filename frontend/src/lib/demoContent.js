/**
 * Offline demo dataset.
 *
 * Used ONLY when the person explicitly clicks "Try the offline demo video" —
 * never silently substituted when a real YouTube URL fails to extract. This
 * keeps the distinction between "real analyzed video" and "example content"
 * unambiguous in the UI.
 */

export const DEMO_TRANSCRIPT = `Introduction to Machine Learning - A Complete Guide

Chapter 1: What is Machine Learning?
Machine learning is a branch of artificial intelligence where computers learn to make decisions from data, rather than being explicitly programmed with rules. There are three major paradigms: Supervised Learning (training on labeled data to learn input-output mapping, used in spam detection, image classification, price prediction), Unsupervised Learning (finding hidden patterns in unlabeled data, used in clustering and anomaly detection), and Reinforcement Learning (an agent learning through rewards and penalties, used in game AI and robotics).

Chapter 2: The Machine Learning Pipeline
Every ML project follows a structured workflow: Data Collection and Cleaning (often 70-80% of effort - real data is messy and biased), Feature Engineering (selecting and transforming useful variables), Model Selection (choosing the right algorithm - Linear Regression for continuous values, Logistic Regression for binary classification, Decision Trees for interpretable decisions, Random Forests for robust ensembles, Neural Networks for complex patterns, SVMs for high-dimensional data), Training (minimize loss via gradient descent), Evaluation (cross-validation, proper metrics), Hyperparameter Tuning (grid search, random search), and Deployment.

Chapter 3: Neural Networks and Deep Learning
Neural networks consist of layers of interconnected nodes. Deep learning uses many layers to learn hierarchical representations. CNNs excel at images - detecting edges in early layers, shapes in middle layers, objects in final layers. RNNs and LSTMs handle sequential data. Transformers (behind GPT, BERT) use attention mechanisms. Training uses backpropagation to adjust weights through gradient descent with loss minimization.

Chapter 4: Key Concepts
Overfitting: model memorizes training data, fails on new data. Fix: regularization (L1/L2), dropout, more data, simpler models. Underfitting: model too simple. Fix: more complex model, better features. The Bias-Variance Tradeoff is fundamental. Cross-validation reliably estimates real-world performance. Transfer learning reuses pre-trained models dramatically reducing data and compute requirements. Key metrics: Accuracy, Precision, Recall, F1-Score, AUC-ROC for classification; MSE, MAE, R-squared for regression.

Chapter 5: Ethics and the Future
ML systems can perpetuate and amplify biases in training data. Real examples: facial recognition performing worse on dark-skinned individuals, hiring algorithms discriminating by gender. Explainability is critical for high-stakes decisions in healthcare and finance. The future includes multimodal AI combining vision, language and audio; federated learning for privacy preservation; more efficient training requiring less data; and AI systems capable of more human-like reasoning. Always start with simple models, measure rigorously, and consider the societal implications of your work.`

export const DEMO_VIDEO = {
  id: 'demo',
  title: 'Introduction to Machine Learning — Complete Course (Demo)',
  channel: 'AI Academy',
  duration: '2:34:15',
  thumbnail: null,
  wordCount: DEMO_TRANSCRIPT.split(/\s+/).length,
}

export const DEMO_NOTES = {
  title: 'Introduction to Machine Learning — Complete Course',
  overview: 'A full walkthrough of machine learning fundamentals: the three core paradigms, the end-to-end ML pipeline, neural networks and deep learning, key concepts like overfitting, and the ethical considerations shaping the field\'s future.',
  keyPoints: [
    'ML has three paradigms: supervised, unsupervised, and reinforcement learning',
    'Data collection and cleaning is often 70-80% of real-world ML effort',
    'Neural networks learn hierarchical representations through layers',
    'Overfitting and underfitting sit on opposite ends of the bias-variance tradeoff',
    'Bias in training data can be amplified by ML systems, with real-world consequences',
  ],
  sections: [
    { heading: 'What is Machine Learning?', content: 'ML lets computers learn decision-making from data instead of explicit rules, across three main paradigms.', bullets: ['Supervised learning: labeled data, e.g. spam detection', 'Unsupervised learning: hidden patterns, e.g. clustering', 'Reinforcement learning: rewards and penalties, e.g. game AI'] },
    { heading: 'The ML Pipeline', content: 'A structured workflow takes a project from raw data to deployed model.', bullets: ['Data collection & cleaning is the most time-consuming step', 'Model choice depends on the problem: trees, forests, SVMs, neural nets', 'Hyperparameter tuning and proper evaluation prevent misleading results'] },
    { heading: 'Neural Networks & Deep Learning', content: 'Layered networks learn increasingly abstract representations of data.', bullets: ['CNNs specialize in images via hierarchical feature detection', 'RNNs/LSTMs handle sequences; Transformers use attention', 'Backpropagation + gradient descent drive training'] },
    { heading: 'Key Concepts: Overfitting & Metrics', content: 'Understanding the bias-variance tradeoff and choosing the right metric is essential for real performance.', bullets: ['Overfitting: fix with regularization, dropout, more data', 'Underfitting: fix with more complex models or better features', 'Use F1/AUC-ROC for classification, MSE/R² for regression'] },
    { heading: 'Ethics & the Future', content: 'ML systems can amplify real-world bias, making fairness and explainability essential.', bullets: ['Facial recognition and hiring algorithms have shown documented bias', 'Explainability matters most in healthcare and finance', 'The future includes multimodal and federated learning'] },
  ],
}

export const DEMO_FLASHCARDS = [
  { front: 'What are the three main paradigms of machine learning?', back: 'Supervised learning (labeled data), Unsupervised learning (hidden patterns in unlabeled data), and Reinforcement learning (rewards/penalties).' },
  { front: 'Why does data collection take up most ML project time?', back: 'Real-world data is messy, incomplete, and biased — cleaning and preparing it well is often 70-80% of total project effort.' },
  { front: 'What is overfitting and how do you fix it?', back: 'A model that memorizes training data but fails on new data. Fix with regularization, dropout, more training data, or a simpler model.' },
  { front: 'What do CNNs excel at and why?', back: 'Images — they detect edges in early layers, shapes in middle layers, and full objects in final layers, building up hierarchical representations.' },
  { front: 'What mechanism powers Transformer models like GPT and BERT?', back: 'Attention mechanisms, which let the model weigh the relevance of different parts of the input when producing each output.' },
  { front: 'What is the bias-variance tradeoff?', back: 'The balance between a model being too simple (high bias, underfitting) and too complex (high variance, overfitting) — the goal is the sweet spot in between.' },
  { front: 'Name two real-world examples of ML bias mentioned in the video.', back: 'Facial recognition performing worse on dark-skinned individuals, and hiring algorithms discriminating by gender.' },
  { front: 'What is transfer learning and why is it useful?', back: 'Reusing a pre-trained model on a new task, dramatically reducing the data and compute needed compared to training from scratch.' },
]

export const DEMO_QUIZ = [
  { question: 'Which learning paradigm uses labeled input-output pairs?', options: ['Unsupervised Learning', 'Supervised Learning', 'Reinforcement Learning', 'Transfer Learning'], correct: 'Supervised Learning', explanation: 'Supervised learning trains on labeled examples to learn a mapping from inputs to outputs.', difficulty: 'Easy' },
  { question: 'What typically consumes 70-80% of effort in an ML project?', options: ['Model training', 'Hyperparameter tuning', 'Data collection and cleaning', 'Deployment'], correct: 'Data collection and cleaning', explanation: 'Real-world data is messy and biased, making cleaning and preparation the most time-consuming phase.', difficulty: 'Easy' },
  { question: 'Which architecture is best suited for image data?', options: ['RNN', 'CNN', 'Linear Regression', 'Decision Tree'], correct: 'CNN', explanation: 'Convolutional Neural Networks detect spatial hierarchies — edges, then shapes, then objects.', difficulty: 'Medium' },
  { question: 'A model that performs great on training data but poorly on new data is exhibiting:', options: ['Underfitting', 'Overfitting', 'Transfer learning', 'Regularization'], correct: 'Overfitting', explanation: 'Overfitting means the model memorized training data rather than learning generalizable patterns.', difficulty: 'Medium' },
  { question: 'What mechanism do Transformer models rely on?', options: ['Backpropagation only', 'Attention', 'K-means clustering', 'Decision boundaries'], correct: 'Attention', explanation: 'Attention mechanisms let Transformers weigh the importance of different input tokens dynamically.', difficulty: 'Medium' },
  { question: 'Which metric is commonly used for regression, not classification?', options: ['F1-Score', 'AUC-ROC', 'Mean Squared Error (MSE)', 'Precision'], correct: 'Mean Squared Error (MSE)', explanation: 'MSE measures average squared prediction error, appropriate for continuous-value regression tasks.', difficulty: 'Hard' },
]

export const DEMO_MINDMAP = {
  label: 'Machine Learning',
  children: [
    { label: 'Paradigms', children: [{ label: 'Supervised' }, { label: 'Unsupervised' }, { label: 'Reinforcement' }] },
    { label: 'ML Pipeline', children: [{ label: 'Data Cleaning' }, { label: 'Feature Engineering' }, { label: 'Model Selection' }, { label: 'Evaluation' }] },
    { label: 'Deep Learning', children: [{ label: 'CNNs (Images)' }, { label: 'RNNs (Sequences)' }, { label: 'Transformers' }] },
    { label: 'Key Concepts', children: [{ label: 'Overfitting' }, { label: 'Bias-Variance' }, { label: 'Transfer Learning' }] },
    { label: 'Ethics & Future', children: [{ label: 'Bias in Data' }, { label: 'Explainability' }, { label: 'Multimodal AI' }] },
  ],
}
