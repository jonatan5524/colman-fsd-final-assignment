import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import User from "../src/models/User";
import Post from "../src/models/Post";
import Comment from "../src/models/Comment";

// Load development environment variables
const envPath = path.resolve(__dirname, "../../.env.development");
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/app_dev";

const seedDatabase = async () => {
	try {
		console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
		await mongoose.connect(MONGODB_URI);
		console.log("Connected to MongoDB successfully.");

		// Clear existing data
		console.log("Clearing existing data...");
		await User.deleteMany({});
		await Post.deleteMany({});
		await Comment.deleteMany({});

		// Create mock users
		console.log("Creating mock users...");
		const salt = await bcrypt.genSalt(10);
		const passwordHash = await bcrypt.hash("password123", salt);

		const users = await User.insertMany([
			{
				email: "john.doe@example.com",
				username: "JohnDoe",
				password: passwordHash,
				profilePicUrl: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
			},
			{
				email: "jane.smith@example.com",
				username: "JaneSmith",
				password: passwordHash,
				profilePicUrl: "https://i.pravatar.cc/150?u=a042581f4e29026704e",
			},
			{
				email: "alice.wonder@example.com",
				username: "AliceW",
				password: passwordHash,
				profilePicUrl: "https://i.pravatar.cc/150?u=a042581f4e29026704f",
			},
		]);

		const [user1, user2, user3] = users;

		// Create mock posts
		console.log("Creating mock posts...");

		const postTemplates = [
			// Nature & Outdoors
			{ content: "Had an amazing day at the beach! The sunset was beautiful. #beach #vacation", img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e", kw: "beach sunset ocean sand vacation tropical beautiful water" },
			{ content: "Exploring the mountains! The trail was challenging but worth it.", img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b", kw: "mountains hiking nature trail landscape outdoors adventure" },
			{ content: "Beautiful snowy morning today. Stay warm everyone!", img: "https://images.unsplash.com/photo-1478265409131-1f65c88f965c", kw: "snow winter cold ice weather morning" },
			{ content: "Camping under the stars. Nothing beats a good campfire.", img: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d", kw: "camping stars night fire nature outdoors" },
			{ content: "Saw a deer on my morning run through the forest. Magical!", img: "https://images.unsplash.com/photo-1448375240586-882707db888b", kw: "forest trees nature deer running wildlife green" },

			// Food & Drink
			{ content: "Just baked a delicious chocolate cake for my friend's birthday!", img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587", kw: "cake chocolate dessert sweet food baking delicious birthday pastry" },
			{ content: "Trying out a new coffee shop downtown. Their latte art is incredible.", img: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf", kw: "coffee cafe latte art espresso drink morning" },
			{ content: "Homemade pizza night! The crust turned out perfectly crispy.", img: "https://images.unsplash.com/photo-1513104890138-7c749659a591", kw: "pizza food cooking dinner cheese italian" },
			{ content: "Exploring the best vegan street food in the city. Amazing flavors!", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd", kw: "vegan food salad healthy meal fresh green" },
			{ content: "Made a giant bowl of ramen for lunch today.", img: "https://images.unsplash.com/photo-1552611052-3ba9d45c65ff", kw: "ramen noodles soup asian food lunch" },

			// Tech & Work
			{ content: "Working fully remote today from my new workspace. Love the new setup.", img: undefined, kw: "" },
			{ content: "Learning React and TypeScript. It's challenging but rewarding!", img: undefined, kw: "" },
			{ content: "Just deployed my first full-stack application to production!", img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c", kw: "code computer laptop programming software deploy tech" },
			{ content: "Attending an awesome tech conference. So many smart people here.", img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87", kw: "conference event tech speakers audience" },
			{ content: "Upgraded my mechanical keyboard. The clicks are so satisfying.", img: "https://images.unsplash.com/photo-1595225476474-87563907a212", kw: "keyboard mechanical typing desk tech gadget" },

			// Pets & Animals
			{ content: "My cat is sleeping in the weirdest position again.", img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba", kw: "cat pet sleeping cute animal feline" },
			{ content: "Took the dog to the dog park. He made so many friends!", img: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b", kw: "dog park running playing pet animal happy" },
			{ content: "Set up a new aquarium in my living room. The tetras love it.", img: undefined, kw: "" },
			{ content: "Watching the birds at my new bird feeder.", img: "https://images.unsplash.com/photo-1522926193341-e9bf1f5f3755", kw: "bird nature feathers colorful feeding" },

			// Books & Media
			{ content: "Just finished reading a fantastic sci-fi novel. Highly recommend!", img: "https://images.unsplash.com/photo-1532012197267-da84d127e765", kw: "book reading literature novel scifi library" },
			{ content: "Binge-watching the new fantasy series. The CGI is insane.", img: undefined, kw: "" },
			{ content: "Listening to some classic jazz on vinyl tonight.", img: "https://images.unsplash.com/photo-1603048297172-c92544798d5e", kw: "music record vinyl player jazz audio" },

			// Sports & Fitness
			{ content: "Completed my first half-marathon! My legs are jelly.", img: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5", kw: "running race marathon fitness sport active" },
			{ content: "Great session at the gym this morning. Feeling strong.", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48", kw: "gym workout weights fitness health exercise" },
			{ content: "Playing basketball with the crew. We won 3 games straight!", img: "https://images.unsplash.com/photo-1519861531473-9200262188bf", kw: "basketball sport court team game hoop" },

			// Travel & Architecture
			{ content: "Exploring the historic streets of old town Europe.", img: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a", kw: "paris france tower city travel architecture europe" },
			{ content: "The skyline view from this rooftop is breathtaking.", img: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df", kw: "city skyline tall buildings night lights urban" },
			{ content: "Visiting a beautiful art museum today.", img: "https://images.unsplash.com/photo-1518998053901-5348d3961a04", kw: "art museum gallery painting exhibition culture" },

			// Lifestyle & Hobbies
			{ content: "Spent the weekend painting. Started a new landscape canvas.", img: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b", kw: "art painting brushes colors creativity hobby" },
			{ content: "Bought some new indoor plants to brighten up my apartment.", img: "https://images.unsplash.com/photo-1485955900006-10f4d324d411", kw: "plants green indoor leaves botany gardening" }
		];

		const generatedPosts = [];
		for (let i = 0; i < 30; i++) {
			const template = postTemplates[i % postTemplates.length];
			const randomUser = users[Math.floor(Math.random() * users.length)];
			const isDifferentAuthor = (u: typeof randomUser) => u._id !== randomUser._id;
			const potentialLikers = users.filter(isDifferentAuthor);
			const numLikes = Math.floor(Math.random() * (potentialLikers.length + 1));
			const likes = potentialLikers.slice(0, numLikes).map(u => u._id);

			generatedPosts.push({
				authorId: randomUser._id,
				content: `${template.content} (Post ${i + 1})`,
				imageUrl: template.img,
				imageKeywords: template.kw,
				likes: likes,
				comments: [],
			});
		}

		const posts = await Post.insertMany(generatedPosts);

		// Create mock comments
		console.log("Creating mock comments...");
		const generatedComments = [];
		for (let i = 0; i < 20; i++) {
			const randomPost = posts[Math.floor(Math.random() * posts.length)];
			const randomUser = users[Math.floor(Math.random() * users.length)];
			generatedComments.push({
				postId: randomPost._id,
				authorId: randomUser._id,
				content: `This is comment number ${i + 1} from ${randomUser.username}!`,
			});
		}
		const comments = await Comment.insertMany(generatedComments);

		// Update posts with comment references
		console.log("Updating posts with their comments...");
		for (const comment of comments) {
			await Post.findByIdAndUpdate(comment.postId, {
				$push: { comments: comment._id },
			});
		}

		console.log("Database seeded successfully!");
		process.exit(0);
	} catch (error) {
		console.error("Error seeding database:", error);
		process.exit(1);
	}
};

seedDatabase();
