import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;


public class PageviewMapper {

	/**
	 * @param args
	 */
	public static void main(String[] args) {
		// TODO Auto-generated method stub
		try {
			BufferedReader br = new BufferedReader(new InputStreamReader(System.in, "ASCII"));
			String filename = System.getenv("map_input_file");
			String date = filename.substring(filename.lastIndexOf("201407"), filename.lastIndexOf("201407") + 8);
			String input, suffix, title;
			Integer count;
			String[] tokens;
			
			while ((input = br.readLine()) != null) {
				tokens = input.split(" ");
				suffix = tokens[0];
				title = tokens[1];
				count = Integer.parseInt(tokens[2]);
				
				/***
				 * filter records based on the following rules
				 */
				
				//rule 1: Filter out all pages that are not english wikipedia. 
				if (!suffix.equals("en"))
					continue;
				
				//rule 2: Exclude any pages whose title starts with the following strings.
				if (title.matches(
						"^(Media|Special|Talk|" +
						"User|User_talk|" +
						"Project|Project_talk|" +
						"File|File_talk|" +
						"MediaWiki|MediaWiki_talk|" +
						"Template|Template_talk|" +
						"Help|Help_talk|" +
						"Category|Category_talk|" +
						"Portal|Wikipedia|Wikipedia_talk):.*$"
				))
					continue;
				
				//rule 3: Filter out all articles that start with lowercase English characters.
				if ((title.charAt(0) >= 97 && title.charAt(0) <= 122))
					continue;
				
				//rule 4: Exclude any article that ends with the following extensions.
				if (
						title.endsWith(".jpg") ||
						title.endsWith(".gif") ||
						title.endsWith(".png") ||
						title.endsWith(".JPG") ||
						title.endsWith(".GIF") ||
						title.endsWith(".PNG") ||
						title.endsWith(".txt") ||
						title.endsWith(".ico"))
					continue;
				
				//rule 5:Articles with titles that exactly (case sensitive) match any of the following strings should be excluded.
				if (title.matches("(404_error/|Main_Page|Hypertext_Transfer_Protocol|Favicon.ico|Search)"))
					continue;
				
				System.out.println(title + "\t" + date + "\t" + count);
			}
		} catch (IOException io) {
			io.printStackTrace();
		}
	}

}
